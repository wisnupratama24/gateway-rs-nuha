# Gateway Nuha

Gateway API backend berbasis Node.js dengan Express.js, Sequelize, dan Redis. Dibangun dengan fokus pada keamanan, performa, dan standar internasional.

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Requirements](#-requirements)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Cara Penggunaan](#-cara-penggunaan)
- [Struktur Project](#-struktur-project)
- [Security Features](#-security-features)
- [API Response Format](#-api-response-format)
- [Docker Deployment](#-docker-deployment)
- [Development](#-development)
- [Best Practices](#-best-practices)

## ✨ Fitur Utama

- ✅ **RESTful API** dengan Express.js 5.x
- ✅ **Database PostgreSQL** dengan Sequelize ORM
- ✅ **Redis** untuk session management dan rate limiting
- ✅ **WebSocket** dengan Socket.io
- ✅ **Rate Limiting** berbasis Redis (IP, User ID, API Key)
- ✅ **Input Validation** dengan express-validator
- ✅ **Input Sanitization** untuk mencegah XSS, SQL Injection, dll
- ✅ **Security Headers** dengan Helmet.js
- ✅ **CORS** dengan origin whitelist
- ✅ **IP Whitelist** untuk akses terbatas
- ✅ **HTTPS Only** enforcement
- ✅ **JWT Authentication**
- ✅ **File Upload** dengan MinIO/S3
- ✅ **Excel Export** dengan ExcelJS
- ✅ **Cron Jobs** untuk task scheduling
- ✅ **Error Handling** yang terstandar
- ✅ **ESLint** untuk code quality

## 🛠 Teknologi yang Digunakan

- **Runtime**: Node.js 20+
- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL dengan Sequelize ORM
- **Cache/Session**: Redis 5.10.0
- **WebSocket**: Socket.io 4.8.3
- **Security**: Helmet, HPP, CORS, express-validator
- **File Storage**: MinIO
- **Other**: JWT, bcrypt, axios, moment, exceljs

## 📦 Requirements

- Node.js 20.x atau lebih baru
- PostgreSQL 12.x atau lebih baru
- Redis 6.x atau lebih baru
- npm atau yarn

**Opsional:**
- Docker & Docker Compose (untuk deployment)
- MinIO (untuk file storage)

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd gateway-nuha
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di root project (lihat bagian [Konfigurasi](#-konfigurasi) untuk detail):

```bash
cp .env.example .env
# Edit .env sesuai kebutuhan
```

### 4. Setup Database

Pastikan PostgreSQL sudah berjalan, lalu buat databasenya

### 5. Run Migrations (jika ada)

-

### 6. Start Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server akan berjalan di `http://localhost:999` (atau port sesuai `PORT_EXPRESS` di `.env`)

## ⚙️ Konfigurasi

File `.env` berisi semua konfigurasi aplikasi. Berikut adalah environment variables yang tersedia:

### Database Configuration

```env
DB_NAME=gateway_nuha
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
DB_PORT=5432
```

### Redis Configuration

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Server Configuration

```env
PORT_EXPRESS=999
APP_ENV=DEV          # DEV | PROD
APP_AREA=LOCAL       # LOCAL | SERVER
TIMEZONE=Asia/Jakarta
BASE_URL=http://localhost:999
```

### JWT Configuration

```env
KEY_JWT=your_secret_jwt_key_here
SESSION_TIME=86400   # dalam detik (24 jam)
```

### MinIO Configuration (Opsional)

```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRETKEY=your_secret_key
MINIO_BUCKET=your_bucket_name
```

### Security Configuration

```env
# CORS Origin Whitelist (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# IP Whitelist (comma-separated, kosongkan untuk disable)
ALLOWED_IPS=127.0.0.1,192.168.1.100

# HTTPS Only (true/false)
HTTPS_ONLY=true

# Trust Proxy (untuk load balancer: true/false atau number)
TRUST_PROXY=true

# Rate Limiting
RATE_LIMIT_ENABLED=true                    # Default: true
RATE_LIMIT_WINDOW_MS=900000               # 15 menit (dalam ms)
RATE_LIMIT_MAX=100                        # Max 100 requests per window
RATE_LIMIT_LOGIN_MAX=5                    # Max 5 login attempts per window

# Body Parser Limit
BODY_PARSER_LIMIT=10mb
```

### Password Policy

```env
MAX_PASSWORD_DAYS=90   # Hari maksimal password berlaku
```

## 📖 Cara Penggunaan

### 1. API Endpoint Structure

Endpoint mengikuti struktur modular:

```
GET    /master/users/list-filter    # List users dengan filter
POST   /master/users                # Create user
GET    /master/users/:id            # Get user by ID
PUT    /master/users/:id            # Update user
DELETE /master/users/:id            # Delete user
```

### 2. Request Format

**Headers yang diperlukan:**

```http
Content-Type: application/json
Authorization: Bearer <token>        # Untuk protected endpoints
X-API-Key: <api-key>                # Alternatif untuk API Key auth
```

**Query Parameters (contoh):**

```http
GET /master/users/list-filter?limit=20&pages=1&sort_key=id_ms_users&sort_by=ASC
```

**Body Request (contoh):**

```json
{
  "email": "user@example.com",
  "nama_lengkap": "John Doe",
  "password": "securePassword123"
}
```

### 3. Response Format

Semua response mengikuti format standar:

**Success Response (200/201):**

```json
{
  "data": {
    "list": [...],
    "meta_data": {
      "count": 100,
      "pages": 5,
      "limit": 20
    }
  },
  "meta_data": {
    "status": 200,
    "message": "Success"
  }
}
```

**Error Response (400/401/403/404/409/500):**

```json
{
  "data": null,
  "meta_data": {
    "status": 400,
    "message": "Validation failed",
    "error": [
      {
        "field": "email",
        "message": "Email harus valid",
        "value": "invalid-email"
      }
    ]
  }
}
```

### 4. Authentication

Aplikasi mendukung beberapa metode autentikasi:

#### a. JWT Token (Bearer Token)

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### b. API Key (X-API-Key)

```http
X-API-Key: your-api-key-here
```

#### c. Session-based (cookies)

Session disimpan di Redis dan menggunakan cookie httpOnly.

### 5. Rate Limiting

Rate limiting otomatis diterapkan berdasarkan:
1. **API Key** (jika header `X-API-Key` ada)
2. **User ID** (jika user sudah login)
3. **IP Address** (fallback)

Default: 100 requests per 15 menit. Untuk login endpoints: 5 attempts per 15 menit.

Response saat rate limit tercapai:

```json
{
  "data": null,
  "meta_data": {
    "status": 429,
    "message": "Too many requests, please try again later"
  }
}
```

### 6. Input Validation

Semua input di-validasi dengan `express-validator`. Contoh validasi di router:

```javascript
const { validate, query, body } = require("../../../../middlewares/validation");

router.get(
  "/list-filter",
  validate([
    query("limit")
      .notEmpty()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit harus berupa angka antara 1-1000")
      .toInt(),
    query("pages")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("Pages harus berupa angka positif")
      .toInt(),
  ]),
  usersController.listFilterUsersController()
);
```

## 📁 Struktur Project

```
gateway-nuha/
├── app.js                          # Entry point aplikasi
├── config/                         # Konfigurasi
│   ├── db/                         # Database config
│   ├── redis/                      # Redis config
│   └── socket/                     # WebSocket config
├── helpers/                        # Helper functions
│   ├── constants/                  # Constants
│   ├── cronJob/                    # Cron job config
│   ├── enkripsi/                   # Encryption helpers
│   ├── env/                        # Environment config
│   ├── error/                      # Custom error classes
│   ├── file/                       # File handling (Excel, MinIO)
│   ├── jwt/                        # JWT helpers
│   ├── models/                     # Model helpers (CRUD)
│   ├── others/                     # Utility functions
│   └── response/                   # Response formatters
├── middlewares/                    # Express middlewares
│   ├── auth/                       # Authentication
│   ├── error/                      # Error handling
│   ├── sanitize/                   # Input sanitization
│   ├── security/                   # Rate limiting
│   ├── success/                    # Success response handler
│   ├── validation/                 # Input validation (express-validator)
│   └── index.js                    # Middleware configuration
├── models/                         # Sequelize models
│   └── master/
│       └── ms_users/               # User model
├── modules/                        # Business logic modules
│   └── master/
│       ├── router/                 # Route definitions
│       └── users/
│           ├── controller/         # Controllers
│           ├── router/             # Route handlers
│           ├── service/            # Business logic
│           └── util/               # Utility functions
├── package.json
├── Dockerfile
└── README.md
```

## 🔒 Security Features

### 1. Helmet.js Security Headers

- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer Policy
- Permissions Policy

### 2. Input Sanitization

Middleware otomatis menyaring input untuk mencegah:
- SQL Injection
- XSS (Cross-Site Scripting)
- Path Traversal
- Code Injection

### 3. CORS Origin Whitelist

Hanya origin yang terdaftar di `ALLOWED_ORIGINS` yang bisa mengakses API.

### 4. IP Whitelist

Opsional: hanya IP yang terdaftar di `ALLOWED_IPS` yang bisa mengakses.

### 5. HTTPS Only

Di production, aplikasi hanya menerima request HTTPS (jika `HTTPS_ONLY=true`).

### 6. Rate Limiting

Mencegah abuse dengan membatasi jumlah request per time window.

### 7. Session Security

- httpOnly cookies (mencegah XSS)
- secure flag di production (HTTPS only)
- sameSite protection (mencegah CSRF)
- Rolling sessions (reset expiry on activity)

### 8. Body Parser Limits

Membatasi ukuran request body untuk mencegah DoS.

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t gateway-nuha:latest .
```

### Run Container

```bash
docker run -d \
  --name gateway-nuha \
  -p 999:999 \
  --env-file .env \
  gateway-nuha:latest
```

### Docker Compose (Contoh)

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "999:999"
    env_file:
      - .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: gateway_nuha
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## 💻 Development

### Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server (nodemon)
npm run prepare    # Setup Husky hooks
```

### Code Style

Proyek menggunakan ESLint dengan konfigurasi:

```bash
# Check linting
npx eslint .

# Fix linting issues
npx eslint --fix .
```

### Git Hooks (Husky)

Pre-commit hook otomatis menjalankan ESLint dan Prettier untuk file yang diubah.

### Error Handling

Custom error classes tersedia di `helpers/error/`:

- `ValidationError` - 400 Bad Request
- `UnauthorizedError` - 401 Unauthorized
- `ForbiddenError` - 403 Forbidden
- `DataNotFoundError` - 404 Not Found
- `DataDuplicateError` - 409 Conflict

Contoh penggunaan:

```javascript
const { ValidationError } = require("../../helpers/error");

if (!email) {
  throw new ValidationError({ 
    message: "Email is required", 
    data: [{ field: "email", message: "Email wajib diisi" }] 
  });
}
```

## 📝 Best Practices

### 1. Response Handling

Selalu gunakan `res.locals.response` untuk menyimpan response data:

```javascript
const { successList } = require("../../helpers/response/responseHelper");

res.locals.response = successList({ data: users, pages: 5, count: 100, limit: 20 });
next();
```

### 2. Error Handling

Selalu gunakan `next(error)` untuk melemparkan error:

```javascript
try {
  // ... logic
} catch (error) {
  next(error);
}
```

### 3. Validation

Gunakan `express-validator` di router, bukan di controller:

```javascript
// ✅ Benar - di router
router.post("/users", 
  validate([body("email").isEmail()]),
  usersController.create()
);

// ❌ Salah - jangan validasi di controller
```

### 4. Service Layer

Business logic harus di service layer, bukan di controller:

```javascript
// ✅ Benar
// controller
const users = await UserService.getAllUsersService({ limit });

// service
static async getAllUsersService({ limit }) {
  // business logic here
}
```

### 5. Environment Variables

Jangan hardcode konfigurasi. Selalu gunakan environment variables:

```javascript
// ✅ Benar
const { PORT_EXPRESS } = require("./helpers/env/env.config");

// ❌ Salah
const port = 999;
```

## 📄 License

ISC

## 👥 Author

Nuha

---

**Happy Coding! 🚀**
