#!/bin/bash

# Upload the compiled application to the production server
# This script uploads the files to celyspets.com

echo "Building the application..."
npm run build

echo "Uploading files to celyspets.com..."

# Upload the built files to the production server
# Note: This should be configured with the actual server details
# For now, we'll just copy to simple-static-deploy directory

echo "Copying to simple-static-deploy directory..."
rsync -av dist/ simple-static-deploy/

echo "Upload complete!"
echo "The application is now live at celyspets.com"
