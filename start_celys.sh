#!/usr/bin/env bash

# Define paths
ROOT_DIR="/Users/midielhenriquez/Library/Mobile Documents/com~apple~CloudDocs/Documents/Investments/CelysPets Inc/dev"
SERVER_DIR="$ROOT_DIR/server"

echo "🚀 Starting CelysPets Development Environment..."
echo "📁 Root: $ROOT_DIR"
echo "🖥️  Server: $SERVER_DIR"
echo ""

# Open VS Code with the project
echo "📝 Opening VS Code..."
code "$ROOT_DIR"
sleep 1

echo "🔧 Starting development servers in separate terminals..."
echo ""

# Start server in new terminal window
echo "🖥️  Opening server terminal..."
osascript << EOF
tell application "Terminal"
    activate
    do script "cd '$SERVER_DIR' && clear && echo '🖥️  CelysPets Server Starting...' && echo 'Port: 5002' && echo 'API: http://localhost:5002' && echo '' && npm run dev"
end tell
EOF

sleep 2

# Start client in another new terminal window  
echo "🌐 Opening client terminal..."
osascript << EOF
tell application "Terminal"
    activate
    do script "cd '$ROOT_DIR' && clear && echo '🌐 CelysPets Client Starting...' && echo 'Port: 5175' && echo 'Frontend: http://localhost:5175' && echo '' && npm run dev:client"
end tell
EOF

sleep 1

echo ""
echo "✅ Development environment started!"
echo ""
echo "📊 Services:"
echo "   🖥️  Server:   http://localhost:5002"
echo "   🌐 Frontend: http://localhost:5175"
echo ""
echo "💡 Tips:"
echo "   • Both services are running in separate Terminal windows"
echo "   • Use Ctrl+C in each terminal to stop the services"
echo "   • Check the terminal windows for logs and errors"
echo ""