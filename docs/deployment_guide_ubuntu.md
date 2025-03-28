# Nexole WAF Deployment Guide for Ubuntu Server

**Version:** 1.0  
**Last Updated:** March 28, 2025

This guide provides comprehensive instructions for deploying the Nexole WAF on an Ubuntu server environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Process](#installation-process)
4. [Configuration](#configuration)
5. [Database Setup](#database-setup)
6. [Starting the Service](#starting-the-service)
7. [Setting Up as a System Service](#setting-up-as-a-system-service)
8. [SSL Configuration](#ssl-configuration)
9. [Firewall Configuration](#firewall-configuration)
10. [Updating the Application](#updating-the-application)
11. [Backup and Recovery](#backup-and-recovery)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying Nexole WAF, make sure you have:

- Ubuntu Server 20.04 LTS or later
- Root or sudo access to the server
- Domain name pointing to your server (for SSL)
- Basic knowledge of Linux command line
- Firewall access to required ports (80, 443, 5000)

## System Requirements

Minimum recommended specifications:

- **CPU:** 2+ cores
- **RAM:** 4GB+
- **Storage:** 20GB+ free space
- **Network:** 100+ Mbps connection
- **Operating System:** Ubuntu 20.04 LTS or newer

## Installation Process

### Step 1: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Required Dependencies

```bash
# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js and npm versions
node -v  # Should be v20.x.x
npm -v   # Should be 10.x.x or higher

# Install build essentials and other dependencies
sudo apt install -y build-essential git curl
```

### Step 3: Install PostgreSQL (Optional - Only if using persistent database)

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify PostgreSQL installation
sudo systemctl status postgresql
```

### Step 4: Clone the Repository

```bash
# Create directory for the application
sudo mkdir -p /opt/nexole-waf
sudo chown $USER:$USER /opt/nexole-waf

# Clone the repository
git clone https://github.com/yourusername/nexole-waf.git /opt/nexole-waf
cd /opt/nexole-waf
```

### Step 5: Install Application Dependencies

```bash
# Install application dependencies
npm install
```

## Configuration

### Step 1: Set Environment Variables

Create a `.env` file in the root directory:

```bash
nano /opt/nexole-waf/.env
```

Add the following configuration (adjust as needed):

```
# Server Configuration
PORT=5000
NODE_ENV=production
SESSION_SECRET=your_strong_session_secret_here

# Firebase Configuration (if using Firebase)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_DATABASE_URL=your_firebase_database_url
```

### Step 2: Configure Application Settings

```bash
# Create production configuration file
nano /opt/nexole-waf/config/production.json
```

Add the following settings (customize as needed):

```json
{
  "server": {
    "port": 5000,
    "host": "0.0.0.0"
  },
  "logging": {
    "level": "info",
    "file": "/var/log/nexole-waf/app.log"
  }
}
```

## Database Setup

### Using in-memory storage (default)

No additional configuration is needed for in-memory storage. The application will run with volatile storage that resets when the service restarts.

### Using PostgreSQL (for production environments)

If you want persistent storage for production use:

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE nexole_waf;
CREATE USER nexole_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE nexole_waf TO nexole_user;
\q

# Update .env file with database connection info
nano /opt/nexole-waf/.env
```

Add the following to .env file:

```
# Database Configuration
DATABASE_URL=postgresql://nexole_user:your_strong_password@localhost:5432/nexole_waf
```

## Starting the Service

### Build the production version

```bash
# Build the client
npm run build
```

### Start the application

```bash
# Start the application in production mode
npm run start:prod
```

## Setting Up as a System Service

Create a systemd service for automatic startup:

```bash
sudo nano /etc/systemd/system/nexole-waf.service
```

Add the following content:

```
[Unit]
Description=Nexole WAF
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/nexole-waf
ExecStart=/usr/bin/npm run start:prod
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=nexole-waf
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable nexole-waf
sudo systemctl start nexole-waf
sudo systemctl status nexole-waf
```

## SSL Configuration

### Step 1: Install Nginx as a reverse proxy

```bash
sudo apt install -y nginx
```

### Step 2: Install Certbot for Let's Encrypt SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 3: Configure Nginx as a reverse proxy

```bash
sudo nano /etc/nginx/sites-available/nexole-waf
```

Add the following configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and obtain SSL certificate:

```bash
sudo ln -s /etc/nginx/sites-available/nexole-waf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Firewall Configuration

Configure the firewall to allow HTTP, HTTPS, and SSH access:

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
sudo ufw status
```

## Updating the Application

To update the Nexole WAF to a newer version:

```bash
# Navigate to the application directory
cd /opt/nexole-waf

# Pull the latest changes
git pull

# Install any new dependencies
npm install

# Rebuild the application
npm run build

# Restart the service
sudo systemctl restart nexole-waf
```

## Backup and Recovery

### Database Backup

If using PostgreSQL, set up regular backups:

```bash
# Create a backup directory
sudo mkdir -p /var/backups/nexole-waf

# Create a backup script
sudo nano /opt/nexole-waf/backup.sh
```

Add the following to the backup script:

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/var/backups/nexole-waf"
pg_dump -U nexole_user nexole_waf > "$BACKUP_DIR/nexole_waf_$DATE.sql"
# Keep only the last 14 backups
ls -tp $BACKUP_DIR/*.sql | grep -v '/$' | tail -n +15 | xargs -I {} rm -- {}
```

Make the script executable and set up a cron job:

```bash
sudo chmod +x /opt/nexole-waf/backup.sh
sudo crontab -e
```

Add the following to run the backup daily at 3 AM:

```
0 3 * * * /opt/nexole-waf/backup.sh
```

### Application Backup

Regularly back up the entire application directory:

```bash
sudo tar -czf /var/backups/nexole-waf/app_backup_$(date +%Y-%m-%d).tar.gz -C /opt nexole-waf
```

## Troubleshooting

Common issues and their solutions:

### Service Won't Start

Check the service logs:

```bash
sudo journalctl -u nexole-waf -n 100
```

### Connection Issues

Verify the firewall is configured correctly:

```bash
sudo ufw status
```

### Database Connection Failure

Check PostgreSQL is running:

```bash
sudo systemctl status postgresql
```

Verify connection credentials:

```bash
psql -U nexole_user -d nexole_waf -h localhost
```

### Unable to Access the Web Interface

Check Nginx configuration:

```bash
sudo nginx -t
sudo systemctl status nginx
```

For more assistance, review the application logs:

```bash
# Application logs
sudo journalctl -u nexole-waf

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```