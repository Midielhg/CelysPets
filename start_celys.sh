#!/bin/bash

osascript <<EOF
tell application "Terminal"
    do script "cd '/Users/midielhenriquez/Library/Mobile Documents/com~apple~CloudDocs/Documents/Investments/CelysPets Inc/dev/server' && npm run dev"
    do script "cd '/Users/midielhenriquez/Library/Mobile Documents/com~apple~CloudDocs/Documents/Investments/CelysPets Inc/dev' && npm run dev:client"
end tell
EOF