#!/bin/bash

# 🚀 Production Build Script for Local Hosting
# This script prepares files for SFTP upload to your hosting server

echo "🏗️  Building Cely's Pets Mobile Grooming for Production..."

# Build Frontend
echo "📦 Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
echo "✅ Frontend build completed"

# Build Backend
echo "📦 Building backend..."
cd server
npm run build:prod
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    exit 1
fi
echo "✅ Backend build completed"

# Copy production environment file
echo "📄 Copying production environment file..."
cp .env.production .env.deploy
echo "✅ Environment file ready"

cd ..

echo ""
echo "🎉 BUILD COMPLETED SUCCESSFULLY!"
echo ""
echo "📁 Files ready for upload:"
echo "   Frontend: ./dist/* → Upload to your website root"
echo "   Backend: ./server/dist/* → Upload to your server directory"
echo "   Environment: ./server/.env.deploy → Rename to .env on server"
echo ""
echo "🔧 Next steps:"
echo "1. Upload files via SFTP"
echo "2. Create MySQL database on hosting server"
echo "3. Import database schema"
echo "4. Test the application"
echo ""
