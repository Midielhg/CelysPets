#!/bin/bash

echo "🚀 Starting Cely's Pets Mobile Grooming Production Server..."

# Start the backend server in production mode
echo "📡 Starting backend server..."
cd server && npm start &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Serve the frontend build files
echo "🌐 Starting frontend server..."
cd .. && npx serve dist -p 5173 &
FRONTEND_PID=$!

echo "✅ Production servers started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for user to stop
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

wait
