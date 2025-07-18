#!/bin/bash

echo "🔧 MongoDB Connection Tester for Cely's Pets"
echo "============================================"

# Test with current credentials
echo "Testing current MongoDB connection..."

# You need to replace 'YOUR_ACTUAL_PASSWORD' with your real MongoDB Atlas password
MONGODB_URI_TEST="mongodb+srv://CepysPets:YOUR_ACTUAL_PASSWORD@cluster0.qejw5mq.mongodb.net/mobile-grooming?retryWrites=true&w=majority&appName=CelysPets"

echo "Instructions:"
echo "1. Go to your MongoDB Atlas dashboard"
echo "2. Check your database user password"
echo "3. Replace 'YOUR_ACTUAL_PASSWORD' in this script with your real password"
echo "4. Run this script again"
echo ""
echo "If you forgot your password:"
echo "1. Go to Database Access in MongoDB Atlas"
echo "2. Click 'Edit' on your CepysPets user"
echo "3. Click 'Edit Password' and set a new one"
echo "4. Use the new password in your connection string"

# Uncomment and modify this line with your actual password:
# export MONGODB_URI="mongodb+srv://CepysPets:YOUR_ACTUAL_PASSWORD@cluster0.qejw5mq.mongodb.net/mobile-grooming?retryWrites=true&w=majority&appName=CelysPets"
# npm run db:test
