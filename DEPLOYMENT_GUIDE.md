# dbmaps — Debian Linux VPS Production Deployment Guide

This guide provides step-by-step instructions for deploying and running **dbmaps** (Real-Time Collaborative ERD & Schema Designer) on a Debian 11 / 12 (Bullseye / Bookworm) Virtual Private Server (VPS).

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & System Preparation](#2-prerequisites--system-preparation)
3. [Dedicated Application User & Directory](#3-dedicated-application-user--directory)
4. [Project Installation & Build](#4-project-installation--build)
5. [Environment & Credentials Configuration](#5-environment--credentials-configuration)
6. [Process Management with PM2](#6-process-management-with-pm2)
7. [Nginx Reverse Proxy & Security Hardening](#7-nginx-reverse-proxy--security-hardening)
8. [SSL/TLS Certificate with Let's Encrypt](#8-ssltls-certificate-with-lets-encrypt)
9. [Firebase Firestore Security Rules Deployment](#9-firebase-firestore-security-rules-deployment)
10. [TallySale Webhook Configuration](#10-tallysale-webhook-configuration)
11. [Firewall & OS Hardening](#11-firewall--os-hardening)
12. [Zero-Downtime Update Script & Maintenance](#12-zero-downtime-update-script--maintenance)

---

## 1. Architecture Overview

```
                          Internet (HTTPS:443)
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Nginx Proxy    │ (SSL Termination, Gzip, Security Headers)
                         └────────┬────────┘
                                  │ Reverse Proxy (http://127.0.0.1:3000)
                                  ▼
                         ┌─────────────────┐
                         │  Node.js Server │ (Express 5 + server.js)
                         │   (PM2 Daemon)  │
                         └────────┬────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Gemini AI API    │    │ Firebase Auth &  │    │ TallySale        │
│ (Schema Engine)  │    │ Firestore DB     │    │ (Payment Webhook)│
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

- **Backend**: Node.js / Express server (`server.js`) listening on `127.0.0.1:3000`.
- **Frontend**: Vue 3 + Tailwind CSS Single Page Application built to `/dist` and served statically by Express in production.
- **Database**: Cloud Firestore with strict Role-Based Access Control (`firestore.rules`).
- **Process Manager**: PM2 for automatic process restart, memory limits, and log management.
- **Web Server / Reverse Proxy**: Nginx with HTTP/2 and Let's Encrypt SSL.

---

## 2. Prerequisites & System Preparation

SSH into your Debian server as `root` or a user with `sudo` privileges:

```bash
ssh root@YOUR_SERVER_IP
```

### 2.1 Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw software-properties-common fail2ban
```

### 2.2 Install Node.js (LTS v20.x or v22.x)
Use NodeSource's official Debian repository:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v   # Should be v20.x or higher
npm -v    # Should be 10.x or higher
```

---

## 3. Dedicated Application User & Directory

Never run your Node.js application as `root`. Create a dedicated system user:

```bash
# Create application user 'dbmaps' with no login shell
sudo adduser --system --group --home /var/www/dbmaps dbmaps

# Set up application directory permissions
sudo mkdir -p /var/www/dbmaps
sudo chown -R dbmaps:dbmaps /var/www/dbmaps
```

---

## 4. Project Installation & Build

### 4.1 Clone or Transfer the Repository
Switch to the application directory:

```bash
cd /var/www/dbmaps

# If using Git:
sudo -u dbmaps git clone https://github.com/YOUR_ORGANIZATION/dbmaps.git .

# Or upload your project files via rsync/sftp, then ensure ownership:
sudo chown -R dbmaps:dbmaps /var/www/dbmaps
```

### 4.2 Install Dependencies
Install production and build dependencies:

```bash
sudo -u dbmaps npm ci
```

### 4.3 Build Frontend Production Bundle
```bash
sudo -u dbmaps npm run build
```
*This compiles the Vue 3 single page application into the `dist/` directory.*

---

## 5. Environment & Credentials Configuration

### 5.1 Create the Production `.env` File
Create `/var/www/dbmaps/.env`:

```bash
sudo -u dbmaps nano /var/www/dbmaps/.env
```

Add your production environment variables:

```ini
# =================================================================
# dbmaps Production Environment Configuration
# =================================================================
NODE_ENV=production
PORT=3000

# Public domain URL (No trailing slash)
APP_URL=https://dbmaps.yourdomain.com

# Server-Side Gemini AI API Key
GEMINI_API_KEY=AIzaSy...YOUR_GEMINI_KEY

# Superadmin Email (Receives full admin tier access)
ADMIN_EMAIL=aungkyawminn.aya@gmail.com

# TallySale Payment Gateway Credentials
TALLYSALE_API_KEY=ts_...YOUR_TALLYSALE_KEY
TALLYSALE_API_SECRET=...YOUR_TALLYSALE_SECRET
TALLYSALE_PAYMENT_URL=https://api.tallysale.com
TALLYSALE_PORTAL_URL=https://tallysale.com

# UI Feature Flags
VITE_ENABLE_UPGRADE_CREDITS=true
```

Secure `.env` file permissions so other users cannot read secrets:
```bash
sudo chmod 600 /var/www/dbmaps/.env
sudo chown dbmaps:dbmaps /var/www/dbmaps/.env
```

### 5.2 Configure Firebase Applet Config
Ensure `/var/www/dbmaps/firebase-applet-config.json` exists with your Firebase web app credentials:

```bash
sudo -u dbmaps nano /var/www/dbmaps/firebase-applet-config.json
```

Example format:
```json
{
  "apiKey": "AIzaSy...",
  "authDomain": "your-app.firebaseapp.com",
  "projectId": "your-firebase-project-id",
  "storageBucket": "your-app.firebasestorage.app",
  "messagingSenderId": "...",
  "appId": "1:...:web:...",
  "firestoreDatabaseId": "(default)"
}
```

Secure the config file:
```bash
sudo chmod 600 /var/www/dbmaps/firebase-applet-config.json
sudo chown dbmaps:dbmaps /var/www/dbmaps/firebase-applet-config.json
```

---

## 6. Process Management with PM2

Install PM2 globally:

```bash
sudo npm install -g pm2
```

### 6.1 Create PM2 Ecosystem File
Create `/var/www/dbmaps/ecosystem.config.cjs`:

```bash
sudo -u dbmaps nano /var/www/dbmaps/ecosystem.config.cjs
```

Paste the following configuration:

```javascript
module.exports = {
  apps: [
    {
      name: 'dbmaps',
      script: 'server.js',
      cwd: '/var/www/dbmaps',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '800M',
      listen_timeout: 10000,
      kill_timeout: 5000,
      error_file: '/var/log/dbmaps/error.log',
      out_file: '/var/log/dbmaps/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

### 6.2 Set Up Log Directory
```bash
sudo mkdir -p /var/log/dbmaps
sudo chown -R dbmaps:dbmaps /var/log/dbmaps
```

### 6.3 Start PM2 Service and Enable on Boot
```bash
# Start the application as the 'dbmaps' user
sudo -u dbmaps pm2 start /var/www/dbmaps/ecosystem.config.cjs

# Save PM2 process list
sudo -u dbmaps pm2 save

# Generate systemd startup script for user 'dbmaps'
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u dbmaps --hp /var/www/dbmaps
```

Check status:
```bash
sudo -u dbmaps pm2 status
sudo -u dbmaps pm2 logs dbmaps --lines 30
```

---

## 7. Nginx Reverse Proxy & Security Hardening

Install Nginx:
```bash
sudo apt install -y nginx
```

### 7.1 Create Nginx Site Configuration
Create `/etc/nginx/sites-available/dbmaps`:

```bash
sudo nano /etc/nginx/sites-available/dbmaps
```

Paste the following configuration (replace `dbmaps.yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name dbmaps.yourdomain.com;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dbmaps.yourdomain.com;

    # SSL certificates will be managed by Certbot (see Section 8)

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Request size limit (Schema generation payloads)
    client_max_body_size 25M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Static Assets Caching
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg)$ {
        root /var/www/dbmaps/dist;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        try_files $uri @proxy;
    }

    # Proxy all traffic to Express Backend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket & Long Polling Support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Request Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for Long-Running AI Generation
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;
    }

    @proxy {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7.2 Enable Site & Test Configuration
```bash
sudo ln -sf /etc/nginx/sites-available/dbmaps /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 8. SSL/TLS Certificate with Let's Encrypt

Install Certbot with Nginx plugin:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain and configure the SSL certificate:
```bash
sudo certbot --nginx -d dbmaps.yourdomain.com
```
*Follow the interactive prompt, enter your email for renewal notices, and agree to the terms.*

Certbot automatically schedules a systemd timer for auto-renewal. Test the renewal process:
```bash
sudo certbot renew --dry-run
```

---

## 9. Firebase Firestore Security Rules Deployment

To guarantee that your production database remains protected from unauthenticated access and privilege escalation:

### 9.1 Install Firebase CLI on VPS (or locally)
```bash
sudo npm install -g firebase-tools
```

### 9.2 Login to Firebase
```bash
firebase login --no-localhost
```
*Copy the URL into your local browser, sign in with your Google account, and paste the authorization code back into the terminal.*

### 9.3 Deploy the Hardened Rules
From `/var/www/dbmaps`:
```bash
cd /var/www/dbmaps
firebase deploy --only firestore:rules
```

Verify that the rules output shows:
```
✔  firestore: released rules firestore.rules to cloud.firestore
```

---

## 10. TallySale Webhook Configuration

Configure the TallySale Merchant Portal to send real-time payment notifications to your server:

1. **Webhook URL**:
   ```
   https://dbmaps.yourdomain.com/api/tallysale/webhook
   ```
2. **HTTP Method**: `POST`
3. **Headers Required**:
   - `x-app-key`: Your TallySale API Key (`TALLYSALE_API_KEY`)
   - `x-timestamp`: Unix epoch timestamp (seconds)
   - `x-signature`: HMAC-SHA256 signature calculated with `TALLYSALE_API_SECRET` over `${timestamp}.${rawJsonBody}`
4. **Testing Webhooks**:
   Once configured, administrators can view incoming and verified webhooks at:
   `https://dbmaps.yourdomain.com/api/tallysale/webhook-logs` (requires Admin Bearer token).

---

## 11. Firewall & OS Hardening

### 11.1 Configure UFW (Uncomplicated Firewall)
```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable UFW
sudo ufw enable
sudo ufw status verbose
```

### 11.2 Configure Fail2ban for SSH Protection
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 12. Zero-Downtime Update Script & Maintenance

Create an automated deployment script `/var/www/dbmaps/deploy.sh`:

```bash
sudo -u dbmaps nano /var/www/dbmaps/deploy.sh
```

Paste:
```bash
#!/usr/bin/env bash
set -e

echo "=== Pulling latest changes ==="
git pull origin main

echo "=== Installing dependencies ==="
npm ci

echo "=== Building frontend ==="
npm run build

echo "=== Reloading PM2 cluster with zero-downtime ==="
pm2 reload ecosystem.config.cjs

echo "=== Deployment completed successfully ==="
```

Make it executable:
```bash
sudo chmod +x /var/www/dbmaps/deploy.sh
sudo chown dbmaps:dbmaps /var/www/dbmaps/deploy.sh
```

Whenever you have an update, simply run:
```bash
sudo -u dbmaps /var/www/dbmaps/deploy.sh
```

---

## 13. Health Check & Verification Checklist

| Checkpoint | Command / Action | Expected Result |
| :--- | :--- | :--- |
| **API Health** | `curl -i https://dbmaps.yourdomain.com/api/health` | `HTTP 200 OK`, JSON status `ok` |
| **Admin Protection** | `curl -i https://dbmaps.yourdomain.com/api/admin/users` | `HTTP 401 Unauthorized` |
| **Webhook Rejection** | `curl -i -X POST https://dbmaps.yourdomain.com/api/tallysale/webhook` | `HTTP 401 Missing x-signature` |
| **PM2 Process** | `sudo -u dbmaps pm2 status` | All cluster instances `online` |
| **SSL Status** | Browser visit to `https://dbmaps.yourdomain.com` | Valid SSL lock icon, no warnings |
