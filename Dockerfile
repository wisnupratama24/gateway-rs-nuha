# Gunakan Node.js versi LTS (Long Term Support) yang ringan
FROM node:20-alpine

# Set timezone agar sesuai dengan server lokal (Asia/Jakarta)
RUN apk add --no-cache tzdata
ENV TZ=Asia/Jakarta

# Set direktori kerja di dalam container
WORKDIR /app

# Salin package.json dan package-lock.json terlebih dahulu (untuk caching layer)
COPY package*.json ./

# Install dependencies
# Menggunakan npm install (bukan ci) agar lebih fleksibel di env development
RUN npm install

# Salin seluruh kode source ke dalam container
COPY . .

# Expose port aplikasi (sesuai .env PORT_EXPRESS)
EXPOSE 3033

# Command default untuk menjalankan aplikasi
CMD ["npm", "run", "start"]
