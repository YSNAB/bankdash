# Deployment Guide - Self-Hosted

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- QZ Tray installed on POS client machines

## 1. Environment Variables

Create a `.env` or `.env.production` file with the following:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# QZ Tray Certificates
QZ_PRIVATE_KEY="your-private-key-here"
QZ_CERTIFICATE="your-certificate-here"
```

### Generate QZ Tray Certificates

If you don't have certificates yet:

```bash
# Generate private key
openssl genrsa -out private-key.pem 2048

# Generate self-signed certificate (valid for 10 years)
openssl req -new -x509 -key private-key.pem -out digital-certificate.crt -days 3650
```

When prompted, you can use these example values:
- Country: NL
- State: Your province
- City: Your city
- Organization: Your company name
- Organizational Unit: POS
- Common Name: Your domain or company name
- Email: your-email@domain.com

### Format certificates for environment variables

Read the certificate files and format them:

**Option 1: Manual (copy file contents)**
```bash
# View private key
cat private-key.pem

# View certificate
cat digital-certificate.crt
```

Copy the **entire content** including the BEGIN/END lines, and replace actual newlines with `\n`:

```bash
QZ_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----"
QZ_CERTIFICATE="-----BEGIN CERTIFICATE-----\nMIIECzCCAvOgAw...\n-----END CERTIFICATE-----"
```

**Option 2: Using a script**
```bash
# Read and format in one go (Linux/Mac)
echo "QZ_PRIVATE_KEY=\"$(cat private-key.pem | sed ':a;N;$!ba;s/\n/\\n/g')\""
echo "QZ_CERTIFICATE=\"$(cat digital-certificate.crt | sed ':a;N;$!ba;s/\n/\\n/g')\""
```

## 2. Database Setup

Run Prisma migrations:

```bash
npx prisma migrate deploy
```

## 3. Build Application

```bash
npm install
npm run build
```

## 4. Start Production Server

```bash
npm start
```

Or with PM2 for process management:

```bash
npm install -g pm2
pm2 start npm --name "bankdash" -- start
pm2 save
pm2 startup  # Follow instructions to enable startup on boot
```

## 5. QZ Tray Setup on Client Machines

### Install QZ Tray

Download and install from: https://qz.io/download/

### Trust Self-Signed Certificate

Since we're using a self-signed certificate, the system will automatically trust it when connecting. No manual intervention needed.

**Alternative**: If you want to manually trust it:
1. Open QZ Tray
2. Go to Advanced → Site Manager
3. Add your domain
4. The certificate will be automatically trusted on first connection

## 6. Reverse Proxy Setup (Optional but Recommended)

### Using Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Using Apache

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    
    SSLEngine on
    SSLCertificateFile /path/to/ssl/certificate.crt
    SSLCertificateKeyFile /path/to/ssl/private.key
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

## 7. Firewall Configuration

Make sure these ports are accessible:

- **3000** (or your chosen port): Application HTTP
- **5432**: PostgreSQL (only from application server)
- **80/443**: Web server (if using reverse proxy)

## 8. Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-script.sh
```

## 9. Monitoring

### Check Application Status

```bash
# With PM2
pm2 status
pm2 logs bankdash

# Manual check
curl http://localhost:3000
```

### Database Health

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

## 10. Updates

```bash
# Pull latest changes
git pull

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart
pm2 restart bankdash
# or
npm start
```

## Troubleshooting

### QZ Tray Connection Issues

1. **Check QZ Tray is running**: Look for QZ icon in system tray
2. **Check browser console**: Look for connection errors
3. **Verify certificate**: Certificate should be auto-trusted
4. **Test endpoint**: Visit `http://your-domain/api/qz/sign` - should return certificate

### Database Connection Issues

1. **Check DATABASE_URL**: Ensure format is correct
2. **Test connection**: `psql $DATABASE_URL`
3. **Check firewall**: Ensure PostgreSQL port is accessible
4. **Check credentials**: Verify username/password

### Print Issues

1. **Check printer connection**: Ensure printer is connected and online
2. **Check QZ Tray logs**: Open QZ Tray → View logs
3. **Test print**: Try a test receipt
4. **Verify ESC/POS support**: Printer must support ESC/POS commands

## Security Considerations

1. **Use HTTPS in production**: Always use SSL/TLS for production
2. **Secure database**: Use strong passwords, limit network access
3. **Environment variables**: Never commit `.env` file to git
4. **Regular updates**: Keep dependencies up to date
5. **Backup regularly**: Implement automated backup strategy
6. **Firewall**: Only expose necessary ports
7. **User access**: Implement proper authentication and authorization

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Application built and tested
- [ ] PM2 or process manager configured
- [ ] Reverse proxy setup (Nginx/Apache)
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backup strategy implemented
- [ ] Monitoring setup
- [ ] QZ Tray installed on client machines
- [ ] Receipt printer ESC/POS tested
- [ ] Documentation provided to users
