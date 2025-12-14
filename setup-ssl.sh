#!/bin/bash

# SSL Setup Script for Rajawali Backend API
# Domain: api.paskibmansabo.com
# VPS: 72.61.140.193

echo "🔐 Starting SSL Setup for Rajawali Backend API..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DOMAIN="api.paskibmansabo.com"
EMAIL="admin@paskibmansabo.com"  # Ganti dengan email Anda
APP_PORT="5005"
BACKEND_DIR="/var/www/rajawali-backend"

echo -e "${YELLOW}Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "Backend Port: $APP_PORT"
echo "Backend Path: $BACKEND_DIR"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}" 
   exit 1
fi

# Step 1: Install Nginx (if not installed)
echo -e "${YELLOW}Step 1: Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt update
    apt install -y nginx
    echo -e "${GREEN}✓ Nginx installed${NC}"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi

# Step 2: Install Certbot
echo -e "${YELLOW}Step 2: Installing Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot installed${NC}"
else
    echo -e "${GREEN}✓ Certbot already installed${NC}"
fi

# Step 3: Create Nginx configuration
echo -e "${YELLOW}Step 3: Creating Nginx configuration...${NC}"
cat > /etc/nginx/sites-available/rajawali-api << EOF
# Rajawali Backend API - HTTP (will be upgraded to HTTPS by certbot)
server {
    listen 80;
    server_name $DOMAIN;

    # Increase body size for file uploads
    client_max_body_size 50M;

    # Proxy to Node.js backend
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
            add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }

    # Static files (uploads)
    location /uploads {
        alias $BACKEND_DIR/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin *;
    }
}
EOF

echo -e "${GREEN}✓ Nginx configuration created${NC}"

# Step 4: Enable site
echo -e "${YELLOW}Step 4: Enabling site...${NC}"
ln -sf /etc/nginx/sites-available/rajawali-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nginx configuration valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration error!${NC}"
    exit 1
fi

# Reload Nginx
systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"

# Step 5: Obtain SSL Certificate
echo -e "${YELLOW}Step 5: Obtaining SSL certificate...${NC}"
echo -e "${YELLOW}⚠️  PENTING: Pastikan DNS $DOMAIN sudah mengarah ke IP VPS ini!${NC}"
echo -e "${YELLOW}Check DNS: nslookup $DOMAIN${NC}"
echo ""
read -p "DNS sudah benar? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Silakan setup DNS dulu, lalu jalankan script ini lagi${NC}"
    exit 1
fi

certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SSL certificate obtained and installed!${NC}"
else
    echo -e "${RED}✗ SSL certificate installation failed!${NC}"
    echo -e "${YELLOW}Possible issues:${NC}"
    echo "1. DNS belum mengarah ke IP VPS"
    echo "2. Port 80/443 terblokir firewall"
    echo "3. Domain tidak valid"
    exit 1
fi

# Step 6: Setup auto-renewal
echo -e "${YELLOW}Step 6: Setting up auto-renewal...${NC}"
systemctl enable certbot.timer
systemctl start certbot.timer
echo -e "${GREEN}✓ Auto-renewal enabled${NC}"

# Step 7: Open firewall ports
echo -e "${YELLOW}Step 7: Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 5005/tcp
    echo -e "${GREEN}✓ Firewall configured${NC}"
else
    echo -e "${YELLOW}⚠️  UFW not installed, skipping firewall config${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ SSL Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Your API is now available at:${NC}"
echo -e "${GREEN}https://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update frontend .env.production:"
echo "   VITE_API_URL=https://$DOMAIN/api"
echo "   VITE_UPLOADS_URL=https://$DOMAIN/uploads"
echo ""
echo "2. Rebuild frontend:"
echo "   npm run build"
echo ""
echo "3. Upload ke Hostinger"
echo ""
echo -e "${YELLOW}Certificate will auto-renew every 60 days${NC}"
echo -e "${YELLOW}Check renewal: certbot renew --dry-run${NC}"
echo ""
echo -e "${GREEN}Test your API:${NC}"
echo "curl https://$DOMAIN/api/health"
