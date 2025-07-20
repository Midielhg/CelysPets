#!/bin/bash

# 🚀 Cely's Pets Backend Startup Script
# This script helps you start the backend application on your hosting server

echo "🔧 Cely's Pets - Backend Startup Helper"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    echo "   Contact your hosting provider for Node.js support."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if we're in the right directory
if [ ! -f "index.js" ]; then
    echo "❌ index.js not found. Make sure you're in the api/ directory."
    echo "   Try: cd /path/to/your/website/api"
    exit 1
fi

echo "✅ Found index.js file"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Make sure all files were uploaded."
    exit 1
fi

echo "✅ Found package.json"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies."
        echo "   Make sure npm is available on your server."
        exit 1
    fi
    
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Test database connection first
echo "🔍 Testing database connection..."
if [ -f "diagnose-localhost-db.js" ]; then
    node diagnose-localhost-db.js
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "⚠️  Database connection failed. Please:"
        echo "   1. Create database 'celyspets_celypets' in your hosting control panel"
        echo "   2. Create user 'celyspets_celypets' with password 'hY9cq6KT3$'"
        echo "   3. Import setup-localhost-database.sql via phpMyAdmin"
        echo ""
        echo "Continue anyway? (y/n)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo "⚠️  Database diagnostic script not found, skipping test"
fi

# Check if port 3001 is available
if command -v lsof &> /dev/null; then
    if lsof -i :3001 &> /dev/null; then
        echo "⚠️  Port 3001 is already in use. Stopping existing process..."
        pkill -f "node.*index.js" 2>/dev/null || true
        sleep 2
    fi
fi

echo ""
echo "🚀 Starting Cely's Pets backend application..."
echo "📍 Starting on port 3001"
echo "🔗 API will be available at: http://yourdomain.com:3001"
echo "🔗 Health check: http://yourdomain.com:3001/health"
echo ""
echo "Press Ctrl+C to stop the application"
echo "=================================================="

# Start the application
node index.js
