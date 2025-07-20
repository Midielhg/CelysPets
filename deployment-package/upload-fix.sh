#!/bin/bash
echo "Uploading corrected appointments.php..."

# Try different upload methods
if command -v rsync &> /dev/null; then
    echo "Trying rsync..."
    rsync -avz api/appointments.php celyspets@celyspets.com:~/public_html/dev/api/ || echo "rsync failed"
fi

if command -v scp &> /dev/null; then
    echo "Trying scp..."
    scp api/appointments.php celyspets@celyspets.com:~/public_html/dev/api/ || echo "scp failed"
fi

echo "Upload attempts completed. Please check if the file was uploaded successfully."
echo "You can test the API at: https://celyspets.com/dev/api/appointments.php"
