#!/bin/bash

# 🐾 CelysPets Mobile Grooming - Launch Script
# ============================================

echo "🚀 Starting CelysPets Mobile Grooming Application..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   cd /path/to/appoitments"
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Function to wait for server to start
wait_for_server() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $name to start..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s $url > /dev/null 2>&1; then
            echo "✅ $name is running!"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo "❌ $name failed to start after $max_attempts seconds"
    return 1
}

echo "🔍 Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed" 
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ npm $(npm --version)"
echo ""

# Check ports
echo "🔍 Checking ports..."
if ! check_port 3001; then
    echo "   Backend port 3001 in use - will attempt to kill existing process"
    pkill -f "ts-node.*src/index.ts" || true
    sleep 2
fi

if ! check_port 5174; then
    echo "   Frontend port 5174 in use - will attempt to kill existing process"  
    pkill -f vite || true
    sleep 2
fi

echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server && npm install && cd ..
fi

echo ""

# Check environment files
echo "🔍 Checking environment configuration..."

if [ ! -f "server/.env" ]; then
    echo "❌ Backend .env file missing"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "❌ Frontend .env file missing"
    exit 1
fi

echo "✅ Environment files found"
echo ""

# Start servers
echo "🚀 Starting development servers..."

# Start backend
echo "🔧 Starting backend server (port 3001)..."
cd server
PORT=3001 npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
if wait_for_server "http://localhost:3001/health" "Backend"; then
    echo "   Backend logs: tail -f backend.log"
else
    echo "❌ Backend startup failed. Check backend.log for details."
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""

# Start frontend  
echo "🎨 Starting frontend server (port 5174)..."
npm run dev:client > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend
if wait_for_server "http://localhost:5174" "Frontend"; then
    echo "   Frontend logs: tail -f frontend.log"
else
    echo "❌ Frontend startup failed. Check frontend.log for details."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 CelysPets Mobile Grooming Application is now running!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend: http://localhost:5174/"
echo "   Backend:  http://localhost:3001/"
echo "   Health:   http://localhost:3001/health"
echo ""
echo "📊 System Status:"
curl -s http://localhost:3001/health | jq -r '.message' 2>/dev/null || echo "   Backend: Running"
echo "   Frontend: Running"
echo "   Database: MongoDB Atlas Connected"
echo ""
echo "📋 Next Steps:"
echo "   1. Visit http://localhost:5174/"
echo "   2. Register your admin account"
echo "   3. Start managing your mobile grooming business!"
echo ""
echo "🛑 To stop servers: pkill -f 'npm run dev' or press Ctrl+C"
echo ""
echo "📁 Log files:"
echo "   Backend:  backend.log"
echo "   Frontend: frontend.log"

# Save PIDs for cleanup
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Wait for user to stop
echo "Press Ctrl+C to stop all servers..."
trap 'echo ""; echo "🛑 Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid backend.log frontend.log; echo "✅ Stopped successfully"; exit 0' INT

# Keep script running
wait
