#!/bin/bash

# Rajawali Backend Deployment Script
# Run this script on your VPS after uploading the backend files

echo "🚀 Starting Rajawali Backend Deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="rajawali-api"
APP_DIR="/var/www/rajawali-backend"
NODE_VERSION="18"

echo -e "${YELLOW}Step 1: Checking Node.js version...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo -e "${GREEN}Node.js version: $(node -v)${NC}"

echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
cd $APP_DIR
npm install --production

echo -e "${YELLOW}Step 3: Setting up environment...${NC}"
if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        cp .env.production .env
        echo -e "${GREEN}.env file created from .env.production${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env with your database credentials:${NC}"
        echo "nano .env"
    else
        echo -e "${RED}Error: .env.production not found!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}.env file already exists${NC}"
fi

echo -e "${YELLOW}Step 4: Creating uploads directory...${NC}"
mkdir -p uploads/{documents,photos,absensi}
chmod -R 755 uploads

echo -e "${YELLOW}Step 5: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo -e "${YELLOW}Step 6: Starting application with PM2...${NC}"
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start src/server.js --name $APP_NAME
pm2 save
pm2 startup

echo -e "${GREEN}✅ Backend deployment completed!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit .env file: nano /var/www/rajawali-backend/.env"
echo "2. Update database credentials"
echo "3. Restart app: pm2 restart $APP_NAME"
echo "4. Check logs: pm2 logs $APP_NAME"
echo "5. Setup Nginx (see DEPLOYMENT.md)"
echo "6. Setup SSL with Let's Encrypt (see DEPLOYMENT.md)"
echo ""
echo -e "${GREEN}View app status: pm2 status${NC}"
echo -e "${GREEN}View app logs: pm2 logs $APP_NAME${NC}"
