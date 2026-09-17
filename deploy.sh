#!/bin/bash
# ==============================================================================
# KaushalSaathi Tracker - Automated Single-Server Production Deployment Script
# Target OS: Ubuntu 20.04 / 22.04 / 24.04 LTS
# Run as: root (or sudo bash deploy.sh)
# ==============================================================================

set -e

# Color helpers
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  KaushalSaathi Tracker - Production Deployment Setup  ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Ensure script is run with sudo/root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Please run this script as root (e.g. sudo bash deploy.sh)${NC}"
  exit 1
fi

# Gather configuration
echo -e "\n${YELLOW}--- Step 1: Configuration ---${NC}"
read -rp "Enter your Domain Name or Server Public IP (e.g., example.com or 123.45.67.89): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
  DOMAIN_NAME="_"
fi

read -rp "Set PostgreSQL database password [default: kaushal_secure_pass_2026]: " DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-"kaushal_secure_pass_2026"}

read -rp "Set Admin Email [default: admin@kaushalsaathi.com]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@kaushalsaathi.com"}

read -rp "Set Admin Password [default: Admin@12345]: " ADMIN_PASSWORD
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"Admin@12345"}

JWT_SECRET=$(openssl rand -hex 32)
WEBHOOK_SECRET=$(openssl rand -hex 16)
INSTALL_DIR="/var/www/salestrack"

# Update system & install dependencies
echo -e "\n${YELLOW}--- Step 2: Installing System Packages ---${NC}"
apt-get update -y
apt-get install -y curl git openssl nginx certbot python3-certbot-nginx postgresql postgresql-contrib

# Install Node.js 20 LTS if not present
if ! command -v node > /dev/null 2>&1; then
  echo -e "${BLUE}Installing Node.js 20 LTS...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2

# Setup PostgreSQL
echo -e "\n${YELLOW}--- Step 3: Setting Up PostgreSQL Database ---${NC}"
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'kaushalsaathi_prod'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE kaushalsaathi_prod;"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = 'kaushalsaathi_user'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER kaushalsaathi_user WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';"

sudo -u postgres psql -c "ALTER USER kaushalsaathi_user WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kaushalsaathi_prod TO kaushalsaathi_user;"
sudo -u postgres psql -c "ALTER DATABASE kaushalsaathi_prod OWNER TO kaushalsaathi_user;"
sudo -u postgres -d kaushalsaathi_prod -c "GRANT ALL ON SCHEMA public TO kaushalsaathi_user;"
sudo -u postgres -d kaushalsaathi_prod -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kaushalsaathi_user;"

# Setup Project Directory
echo -e "\n${YELLOW}--- Step 4: Configuring Application Files ---${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$SCRIPT_DIR" != "$INSTALL_DIR" ]; then
  mkdir -p "$INSTALL_DIR"
  cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR"/ 2>/dev/null || true
fi

cd "$INSTALL_DIR"

# Configure Backend .env
cat <<EOF > "$INSTALL_DIR/backend/.env"
DATABASE_URL="postgresql://kaushalsaathi_user:${DB_PASSWORD}@localhost:5432/kaushalsaathi_prod?schema=public"
JWT_SECRET="${JWT_SECRET}"
PORT=5000
NODE_ENV=production
CORS_ORIGIN="*"
GOOGLE_FORM_WEBHOOK_SECRET="${WEBHOOK_SECRET}"
SEED_ADMIN_EMAIL="${ADMIN_EMAIL}"
SEED_ADMIN_PASSWORD="${ADMIN_PASSWORD}"
EOF

# Build Backend & Run Migrations
echo -e "\n${YELLOW}--- Step 5: Setting Up Backend & Database Migrations ---${NC}"
cd "$INSTALL_DIR/backend"
npm install
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js || true

# Start or restart Backend with PM2
pm2 delete kaushalsaathi-backend 2>/dev/null || true
pm2 start src/server.js --name "kaushalsaathi-backend" -i max
pm2 save
pm2 startup systemd -u root --hp /root --force 2>/dev/null || true

# Build Frontend
echo -e "\n${YELLOW}--- Step 6: Building Frontend ---${NC}"
cd "$INSTALL_DIR/frontend"
npm install
npm run build

# Configure NGINX
echo -e "\n${YELLOW}--- Step 7: Configuring NGINX Reverse Proxy ---${NC}"
cat <<EOF > /etc/nginx/sites-available/kaushalsaathi
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    # Serve built static frontend
    location / {
        root ${INSTALL_DIR}/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests to backend Express server
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/kaushalsaathi /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t
systemctl reload nginx
systemctl enable nginx

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  ✓ KaushalSaathi Tracker Successfully Deployed!      ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "Access URL:       http://${DOMAIN_NAME}"
echo -e "Admin Login:      ${ADMIN_EMAIL}"
echo -e "Admin Password:   ${ADMIN_PASSWORD}"
echo -e "Database:         kaushalsaathi_prod (user: kaushalsaathi_user)"
echo -e "\n${BLUE}To enable free SSL (HTTPS) with Let's Encrypt later, run:${NC}"
echo -e "  sudo certbot --nginx -d ${DOMAIN_NAME}\n"
