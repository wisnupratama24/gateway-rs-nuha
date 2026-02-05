/**
 * =============================================================================
 * DASHBOARD UTILITY - Fetch Data dari API Eksternal
 * =============================================================================
 *
 * Utility ini bertugas mengambil data dari Open API NUHA untuk keperluan
 * sinkronisasi dashboard. Mendukung multiple sync types dengan dynamic parameters.
 *
 * =============================================================================
 * FITUR UTAMA (KNOWLEDGE SESI 2):
 * =============================================================================
 *
 * 1. TOKEN MANAGEMENT
 *    - Token disimpan di Redis Cache (TTL: 12 jam)
 *    - Auto refresh jika cache kosong
 *
 * 2. RETRY MECHANISM
 *    - Otomatis retry jika error 401 (token expired)
 *    - Clear cache → Refresh token → Retry request
 *
 * 3. DYNAMIC PARAMETERS
 *    - Support berbagai sync types (jadwal, booking, dll)
 *    - Flexible date field names
 *
 * =============================================================================
 * ALUR KERJA:
 * =============================================================================
 *
 *   Request
 *      ↓
 *   Cek Token di Cache ──────────────────┐
 *      ↓ (tidak ada)                     ↓ (ada)
 *   Refresh Token dari API          Gunakan token cache
 *      ↓                                 ↓
 *   Simpan ke Cache ─────────────────────┤
 *                                        ↓
 *                                   Hit API Eksternal
 *                                        ↓
 *                              ┌─── Error 401? ───┐
 *                              ↓                  ↓
 *                             YES                NO
 *                              ↓                  ↓
 *                       Clear Cache          Return Data
 *                       Retry (1x)
 *
 * =============================================================================
 */

const axios = require("axios");
const { CLIENT_1 } = require("../../../config/redis");
const { EXTERNAL_API_URL, EXTERNAL_API_TOKEN, EXTERNAL_API_KEY, EXTERNAL_API_REFRESH_TOKEN } = require("../../../helpers/env/envConfig");

class DashboardUtil {
	// =========================================================================
	// KONSTANTA KONFIGURASI
	// =========================================================================

	/**
	 * TTL (Time To Live) untuk cache token di Redis
	 * Nilai: 43200 detik = 12 jam
	 *
	 * CATATAN WORKSHOP:
	 * - Token disimpan di Redis agar tidak perlu refresh setiap request
	 * - 12 jam dipilih karena token API NUHA biasanya valid ~24 jam
	 * - Dengan 12 jam, kita punya buffer sebelum token benar-benar expired
	 */
	static TOKEN_CACHE_TTL = 43200; // 12 jam dalam detik

	/**
	 * Key untuk menyimpan token di Redis
	 * Menggunakan key yang sama dengan modul dokter agar bisa sharing cache
	 */
	static TOKEN_CACHE_KEY = "open_api_token";

	/**
	 * Maksimal retry jika request gagal karena token expired
	 *
	 * CATATAN WORKSHOP:
	 * - Retry 1x sudah cukup untuk kasus token expired
	 * - Jika masih gagal setelah retry, kemungkinan ada masalah lain misalnya API-KEY sudah expired
	 */
	static MAX_RETRY = 1;

	// =========================================================================
	// METHOD UTAMA: Fetch Data dari API Eksternal
	// =========================================================================

	/**
	 * Mengambil data dari eksternal API dengan pagination.
	 * Method ini generic dan bisa digunakan oleh semua sync types.
	 *
	 * FITUR:
	 * - Token management dengan caching
	 * - Auto retry jika token expired
	 * - Support dynamic parameters
	 *
	 * @param {Object} params - Parameter filter (dynamic based on sync type)
	 * @param {number} params.id_laporan_view - ID Laporan di API (123, 239, dll)
	 * @param {number} params.pages - Halaman yang ingin diambil
	 * @param {number} params.limit - Jumlah record per halaman
	 * @param {*} params.* - Other params (flexible: date fields, filters, dll)
	 * @returns {Object} Response data dari API (termasuk meta_data)
	 */
	static async fetchDataFromExternal(params) {
		try {
			// Panggil method internal dengan retry mechanism
			return await this._fetchWithRetry(params, 0);
		} catch (error) {
			console.error("[DashboardUtil] Error fetching external data:", error.message);
			throw new Error("Gagal mengambil data dari API Eksternal. Cek koneksi atau token.");
		}
	}

	// =========================================================================
	// METHOD INTERNAL: Fetch dengan Retry
	// =========================================================================

	/**
	 * Method internal untuk fetch data dengan mekanisme retry
	 *
	 * ALUR RETRY:
	 * 1. Ambil token dari cache/refresh
	 * 2. Hit API eksternal
	 * 3. Jika error 401 (Unauthorized):
	 *    - Hapus token dari cache (force expired)
	 *    - Retry request (akan otomatis refresh token)
	 * 4. Jika sukses atau error lain, return/throw
	 *
	 * CATATAN WORKSHOP:
	 * Pola ini penting untuk production karena:
	 * - Token bisa expired lebih cepat dari TTL cache
	 * - Server bisa invalidate token kapan saja
	 * - Sync process tidak terganggu oleh token expired
	 *
	 * @param {Object} params - Parameter untuk API
	 * @param {number} retryCount - Counter retry saat ini
	 * @returns {Object} Response dari API
	 */
	static async _fetchWithRetry(params, retryCount) {
		const url = `${EXTERNAL_API_URL}/v3/view/view-table/list-filter-access`;

		// =====================================================
		// STEP 1: Ambil Token (dari cache atau refresh baru)
		// =====================================================
		const tokenData = await this.getToken();

		// =====================================================
		// STEP 2: Setup HTTP Headers dengan Token
		// =====================================================
		const config = {
			headers: {
				"Content-Type": "application/json",
				token: tokenData.token,
				"x-api-key": EXTERNAL_API_KEY,
			},
		};

		// =====================================================
		// STEP 3: Build Request Body (Dynamic)
		// =====================================================
		// Menggunakan spread operator agar bisa terima semua params
		// Ini membuat util flexible untuk berbagai sync types
		const body = {
			// Pagination (wajib)
			pages: params.pages || 1,
			limit: params.limit || 10,

			// Spread remaining params (date fields, filters, dll)
			// Contoh: filter_tanggal_awal, waktu_registrasi_awal, dll
			...params,

			// Default filters (opsional)
			id_dokter: params.id_dokter || null,
			kode_spesialis: params.kode_spesialis || null,
		};

		try {
			// =====================================================
			// STEP 4: Hit API Eksternal
			// =====================================================
			const response = await axios.post(url, body, config);

			// Return full response (data + meta_data)
			return response.data;
		} catch (error) {
			// =====================================================
			// STEP 5: Handle Error - Cek apakah token expired
			// =====================================================
			if (this._isTokenExpiredError(error) && retryCount < this.MAX_RETRY) {
				console.log(`[DashboardUtil] Token expired, retrying (${retryCount + 1}/${this.MAX_RETRY})...`);

				// Force hapus token dari cache
				await this._clearTokenCache();

				// Retry request (akan otomatis refresh token di getToken())
				return await this._fetchWithRetry(params, retryCount + 1);
			}

			// Jika bukan error token atau sudah max retry, lempar error
			throw error;
		}
	}

	// =========================================================================
	// TOKEN MANAGEMENT
	// =========================================================================

	/**
	 * Mengambil token untuk akses API eksternal
	 *
	 * STRATEGI CACHING:
	 * 1. Cek Redis, jika ada → gunakan token dari cache
	 * 2. Jika tidak ada → refresh token dari API → simpan ke cache
	 *
	 * CATATAN WORKSHOP:
	 * Caching token penting untuk:
	 * - Mengurangi hit ke endpoint refresh token
	 * - Mempercepat response time
	 * - Menghindari rate limiting dari server
	 * - Sharing token antar modul (dokter & dashboard)
	 *
	 * @returns {Object} { token, refresh_token }
	 */
	static async getToken() {
		// =====================================================
		// STEP 1: Cek apakah token ada di Redis cache
		// =====================================================
		let cachedToken = await CLIENT_1.get(this.TOKEN_CACHE_KEY);

		if (cachedToken) {
			// -------------------------------------------------
			// CASE 1: Token DITEMUKAN di cache → Gunakan langsung
			// -------------------------------------------------
			console.log("[DashboardUtil] Using cached token");
			return JSON.parse(cachedToken);
		} else {
			// -------------------------------------------------
			// CASE 2: Token TIDAK ADA di cache → Refresh dari API
			// -------------------------------------------------
			console.log("[DashboardUtil] Cache miss, refreshing token from API...");

			const url = `${EXTERNAL_API_URL}/v3/view/view-table/refresh-token-access`;

			// Header untuk refresh token
			// Menggunakan token & refresh_token dari environment variable
			const headers = {
				"Content-Type": "application/json",
				token: EXTERNAL_API_TOKEN,
				refresh_token: EXTERNAL_API_REFRESH_TOKEN,
				"x-api-key": EXTERNAL_API_KEY,
			};

			// Hit endpoint refresh token
			try {
				const response = await axios.post(url, {}, { headers });

				// Ambil token baru dari response
				const newToken = {
					token: response.data.data?.token || response.data.token,
					refresh_token: response.data.data?.refresh_token || response.data.refresh_token,
				};

				// Simpan token baru ke Redis dengan TTL
				await CLIENT_1.set(
					this.TOKEN_CACHE_KEY,
					JSON.stringify(newToken),
					{ EX: this.TOKEN_CACHE_TTL }, // Expired dalam 12 jam
				);

				console.log(`[DashboardUtil] New token cached for ${this.TOKEN_CACHE_TTL} seconds`);

				return newToken;
			} catch (refreshError) {
				console.error("[DashboardUtil] Refresh token failed:", refreshError.response?.data || refreshError.message);
				throw refreshError;
			}
		}
	}

	// =========================================================================
	// HELPER METHODS
	// =========================================================================

	/**
	 * Cek apakah error disebabkan oleh token expired/invalid
	 *
	 * CATATAN WORKSHOP:
	 * HTTP 401 Unauthorized biasanya menandakan:
	 * - Token expired
	 * - Token invalid/revoked
	 * - Token tidak ada/salah format
	 *
	 * @param {Error} error - Error object dari request
	 * @returns {boolean} true jika error karena token
	 */
	static _isTokenExpiredError(error) {
		// Cek status code 401 (Unauthorized)
		if (error.response && error.response.status === 401) {
			return true;
		}

		// Cek message yang mengandung kata kunci token
		const errorMessage = error.message?.toLowerCase() || "";
		if (errorMessage.includes("token") || errorMessage.includes("unauthorized")) {
			return true;
		}

		return false;
	}

	/**
	 * Hapus token dari Redis cache
	 *
	 * CATATAN WORKSHOP:
	 * Method ini dipanggil saat:
	 * - Token terdeteksi expired/invalid (dalam retry)
	 * - Force refresh dipanggil
	 */
	static async _clearTokenCache() {
		await CLIENT_1.del(this.TOKEN_CACHE_KEY);
		console.log("[DashboardUtil] Token cache cleared");
	}
}

module.exports = DashboardUtil;
