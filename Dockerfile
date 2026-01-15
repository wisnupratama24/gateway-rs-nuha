FROM node:20-bookworm-slim

WORKDIR /app

# Install necessary dependencies for Node.js backend
# Includes dependencies for exceljs (cairo, pango) and native modules (bcrypt)
RUN apt-get update && apt-get install -yq \
  ca-certificates \
  fonts-liberation \
  libappindicator1 \
  libnss3 \
  lsb-release \
  xdg-utils \
  wget \
  xvfb \
  curl \
  gnupg \
  unzip \
  sudo \
  build-essential \
  python3 \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Copy package files first for better layer caching
COPY package*.json ./

# Install npm dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application files
COPY . .

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser \
  && chown -R appuser:appuser /app

USER appuser

# Expose the port the app runs on
EXPOSE 3033

# Command to start the application
CMD ["node", "app.js"]
