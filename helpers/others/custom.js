class Custom {
	static format_ip(ip) {
		const array_ip = ip.split(":");

		if (array_ip.length === 3) {
			return array_ip[2];
		} else {
			return array_ip[3];
		}
	}
	static isNull(data) {
		if (data === "undefined" || data === undefined || data === null || data === "") {
			return true;
		} else {
			return false;
		}
	}

	static itSelfEmpty = (val, pattern = "", outPut = undefined) => {
		if (this.isNull(val)) {
			return pattern;
		} else {
			if (this.isNull(outPut)) {
				return val;
			} else {
				return outPut;
			}
		}
	};

	static async NumberRomawi(num) {
		if (typeof num !== "number") return false;

		var digits = String(+num).split(""),
			key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM", "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC", "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"],
			roman_num = "",
			i = 3;
		while (i--) roman_num = (key[+digits.pop() + i * 10] || "") + roman_num;
		return Array(+digits.join("") + 1).join("M") + roman_num;
	}

	static async uuidv4() {
		return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
	}

	static setDateWithtime(variable) {
		return new Promise((resolve, reject) => {
			let result = variable.split(" ");
			if (result.length === 2) {
				resolve(result[0] + `+` + result[1]);
			} else {
				reject({ status: 500, message: "datetime tidak sesuai" });
			}
		});
	}

	static getBulan(bulan) {
		let namabulan = "";
		switch (bulan) {
			case 1:
				namabulan = "januari";
				break;
			case 2:
				namabulan = "februari";
				break;
			case 3:
				namabulan = "maret";
				break;
			case 4:
				namabulan = "april";
				break;
			case 5:
				namabulan = "mei";
				break;
			case 6:
				namabulan = "juni";
				break;
			case 7:
				namabulan = "juli";
				break;
			case 8:
				namabulan = "agustus";
				break;
			case 9:
				namabulan = "september";
				break;
			case 10:
				namabulan = "oktober";
				break;
			case 11:
				namabulan = "november";
				break;
			case 12:
				namabulan = "desember";
				break;
		}
		return namabulan;
	}

	static async capitalize(text) {
		return text.replace(/\b\w/g, (match) => match.toUpperCase());
	}

	static terbilang(angka) {
		const bilne = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

		if (angka < 12) {
			return bilne[angka];
		} else if (angka < 20) {
			return this.terbilang(angka - 10) + " belas";
		} else if (angka < 100) {
			return this.terbilang(Math.floor(parseInt(angka) / 10)) + " puluh " + this.terbilang(parseInt(angka) % 10);
		} else if (angka < 200) {
			return "seratus " + this.terbilang(parseInt(angka) - 100);
		} else if (angka < 1000) {
			return this.terbilang(Math.floor(parseInt(angka) / 100)) + " ratus " + this.terbilang(parseInt(angka) % 100);
		} else if (angka < 2000) {
			return "seribu " + this.terbilang(parseInt(angka) - 1000);
		} else if (angka < 1000000) {
			return this.terbilang(Math.floor(parseInt(angka) / 1000)) + " ribu " + this.terbilang(parseInt(angka) % 1000);
		} else if (angka < 1000000000) {
			return this.terbilang(Math.floor(parseInt(angka) / 1000000)) + " juta " + this.terbilang(parseInt(angka) % 1000000);
		} else if (angka < 1000000000000) {
			return this.terbilang(Math.floor(parseInt(angka) / 1000000000)) + " milyar " + this.terbilang(parseInt(angka) % 1000000000);
		} else if (angka < 1000000000000000) {
			return this.terbilang(Math.floor(parseInt(angka) / 1000000000000)) + " trilyun " + this.terbilang(parseInt(angka) % 1000000000000);
		}
	}
}

module.exports = Custom;
