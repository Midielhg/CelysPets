#!/bin/bash

# 🚀 LOCALHOST DATABASE DEPLOYMENT SCRIPT
# This script helps you deploy and troubleshoot localhost database connections

echo "🔧 Cely's Pets - Localhost Database Deployment Helper"
echo "=================================================="

# Build the application
echo ""
echo "📦 Step 1: Building application..."
./build-production.sh

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors first."
    exit 1
fi

echo "✅ Build completed successfully!"

# Create deployment package
echo ""
echo "📁 Step 2: Creating deployment package..."

# Create deployment directory
mkdir -p deployment-package

# Copy frontend files
echo "   → Copying frontend files..."
cp -r dist/* deployment-package/

# Create API directory and copy backend files
echo "   → Copying backend files..."
mkdir -p deployment-package/api
cp -r server/dist/* deployment-package/api/
cp server/package.json deployment-package/api/
cp server/.env.production deployment-package/api/.env

# Copy database setup file
echo "   → Copying database setup..."
cp setup-localhost-database.sql deployment-package/

# Copy diagnostic tools
echo "   → Copying diagnostic tools..."
cp server/diagnose-localhost-db.js deployment-package/api/
cp server/.env.localhost-alt1 deployment-package/api/
cp server/.env.localhost-cpanel deployment-package/api/

echo "✅ Deployment package created in: deployment-package/"

# Show deployment instructions
echo ""
echo "📋 Step 3: Deployment Instructions"
echo "=================================="
echo ""
echo "🔹 Upload via SFTP:"
echo "   → Upload contents of deployment-package/ to your website root"
echo ""
echo "🔹 Database Setup:"
echo "   1. Go to your hosting control panel"
echo "   2. Create MySQL database: celyspets_celypets"
echo "   3. Create MySQL user: celyspets_celypets (password: hY9cq6KT3$)"
echo "   4. Grant ALL privileges to user"
echo "   5. Import setup-localhost-database.sql via phpMyAdmin"
echo ""
echo "🔹 Troubleshooting:"
echo "   1. SSH into your server"
echo "   2. cd /path/to/your/website/api"
echo "   3. Run: node diagnose-localhost-db.js"
echo "   4. Try different .env files if needed:"
echo "      - mv .env.localhost-alt1 .env    (for 127.0.0.1)"
echo "      - mv .env.localhost-cpanel .env  (for cPanel hosting)"
echo ""
echo "🔹 Start Application:"
echo "   → node api/index.js"
echo ""
echo "🔹 Test Login:"
echo "   → https://yourdomain.com"
echo "   → Email: admin@celyspets.com"
echo "   → Password: admin123"
echo ""

# Create a quick deployment checklist
cat > deployment-package/DEPLOYMENT-CHECKLIST.txt << 'EOF'
# 🚀 DEPLOYMENT CHECKLIST

## Before Upload:
- [ ] Built application successfully
- [ ] Have SFTP credentials ready
- [ ] Know your hosting control panel URL

## Upload Files:
- [ ] Upload all files from deployment-package/ to website root
- [ ] Verify all files uploaded correctly

## Database Setup:
- [ ] Created database: celyspets_celypets
- [ ] Created user: celyspets_celypets (password: hY9cq6KT3$)
- [ ] Granted ALL privileges to user
- [ ] Imported setup-localhost-database.sql via phpMyAdmin

## Troubleshooting:
- [ ] SSH into server
- [ ] Run: node api/diagnose-localhost-db.js
- [ ] Try alternative .env files if needed
- [ ] Contact hosting support if MySQL isn't running

## Test Application:
- [ ] Start backend: node api/index.js
- [ ] Visit website: https://yourdomain.com
- [ ] Login with admin@celyspets.com / admin123
- [ ] Test appointment management features

## Common Issues:
- Database connection failed → Check credentials in hosting control panel
- Tables not found → Re-import setup-localhost-database.sql
- Access denied → Verify user permissions
- Connection refused → Check if MySQL is running

## Contact Info:
If you need help, provide these details:
- Hosting provider name
- Error messages from diagnose-localhost-db.js
- Database credentials from hosting control panel
EOF

echo "📄 Deployment checklist created: deployment-package/DEPLOYMENT-CHECKLIST.txt"
echo ""
echo "🎉 Ready for deployment! Upload the deployment-package/ contents via SFTP."
