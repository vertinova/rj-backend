#!/bin/bash

# Script untuk deploy backend ke VPS
# Jalankan dari Git Bash atau WSL di Windows

echo "🚀 Deploying Rajawali Backend to VPS..."

# Configuration
VPS_IP="72.61.140.193"
VPS_USER="root"  # Ganti dengan username VPS Anda
VPS_PATH="/var/www/rajawali-backend"
APP_NAME="rajawali-api"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Menghapus node_modules lokal untuk mempercepat upload...${NC}"
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo -e "${GREEN}node_modules dihapus${NC}"
fi

echo -e "${YELLOW}Step 2: Sync files ke VPS...${NC}"
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'logs/*.log' \
  --exclude 'uploads/*' \
  --exclude '.env.local' \
  ./ ${VPS_USER}@${VPS_IP}:${VPS_PATH}/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Files berhasil di-upload${NC}"
else
    echo -e "${RED}❌ Upload gagal!${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 3: Install dependencies dan setup aplikasi di VPS...${NC}"
ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
cd /var/www/rajawali-backend

echo "Installing dependencies..."
npm install --production

echo "Running database migrations..."
node src/database/migrate.js

echo "Creating necessary directories..."
mkdir -p uploads/lakaraja uploads/photos uploads/documents uploads/absensi logs

echo "Setting proper permissions..."
chmod -R 755 uploads logs

echo "Restarting PM2 application..."
pm2 restart rajawali-api || pm2 start src/server.js --name rajawali-api

echo "Saving PM2 configuration..."
pm2 save

echo "✅ Backend berhasil di-restart!"
echo ""
echo "📊 Status aplikasi:"
pm2 status rajawali-api
echo ""
echo "📝 Recent logs:"
pm2 logs rajawali-api --lines 20 --nostream
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Deployment selesai!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Untuk melihat logs:${NC}"
    echo "ssh ${VPS_USER}@${VPS_IP} 'pm2 logs rajawali-api'"
    echo ""
    echo -e "${YELLOW}Untuk melihat status:${NC}"
    echo "ssh ${VPS_USER}@${VPS_IP} 'pm2 status'"
else
    echo -e "${RED}❌ Deployment gagal!${NC}"
    exit 1
fi
