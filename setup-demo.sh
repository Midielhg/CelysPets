#!/bin/bash

# 🐾 CelysPets Business Setup - Demo Data Creator
# ===============================================

echo "🎯 Setting up CelysPets Mobile Grooming with demo data..."
echo ""

API_BASE="http://localhost:3001/api"
ADMIN_EMAIL="admin@celyspets.com"
ADMIN_PASSWORD="admin123"

# Function to check if servers are running
check_servers() {
    if ! curl -s http://localhost:3001/health > /dev/null; then
        echo "❌ Backend server is not running"
        echo "   Please run: ./start-app.sh first"
        exit 1
    fi
    
    if ! curl -s http://localhost:5174 > /dev/null; then
        echo "❌ Frontend server is not running"
        echo "   Please run: ./start-app.sh first"
        exit 1
    fi
    
    echo "✅ Servers are running"
}

# Function to register admin user
setup_admin() {
    echo "👤 Setting up admin user..."
    
    RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"firstName\": \"Admin\",
            \"lastName\": \"User\",
            \"email\": \"$ADMIN_EMAIL\",
            \"password\": \"$ADMIN_PASSWORD\",
            \"role\": \"admin\"
        }")
    
    if echo "$RESPONSE" | grep -q "token"; then
        echo "✅ Admin user created successfully"
        TOKEN=$(echo "$RESPONSE" | jq -r '.token')
        echo "   Email: $ADMIN_EMAIL"
        echo "   Password: $ADMIN_PASSWORD"
    elif echo "$RESPONSE" | grep -q "already exists"; then
        echo "⚠️  Admin user already exists, logging in..."
        LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
            -H "Content-Type: application/json" \
            -d "{
                \"email\": \"$ADMIN_EMAIL\",
                \"password\": \"$ADMIN_PASSWORD\"
            }")
        TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
        echo "✅ Logged in successfully"
    else
        echo "❌ Failed to create admin user"
        echo "Response: $RESPONSE"
        exit 1
    fi
}

# Function to create demo clients
create_demo_clients() {
    echo ""
    echo "🐕 Creating demo clients..."
    
    # Client 1: Sarah Johnson
    echo "   Creating client: Sarah Johnson..."
    curl -s -X POST "$API_BASE/clients" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{
            "firstName": "Sarah",
            "lastName": "Johnson", 
            "email": "sarah.johnson@email.com",
            "phone": "(407) 555-0123",
            "address": {
                "street": "123 Pine Street",
                "city": "Orlando",
                "state": "FL",
                "zipCode": "32801"
            },
            "pets": [{
                "name": "Buddy",
                "breed": "Golden Retriever",
                "age": 3,
                "weight": 65,
                "specialInstructions": "Very friendly, loves treats"
            }],
            "preferences": {
                "preferredTimeSlots": ["morning"],
                "recurringService": true,
                "recurringFrequency": "monthly"
            }
        }' > /dev/null && echo "     ✅ Sarah Johnson & Buddy created"

    # Client 2: Mike Rodriguez  
    echo "   Creating client: Mike Rodriguez..."
    curl -s -X POST "$API_BASE/clients" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{
            "firstName": "Mike",
            "lastName": "Rodriguez",
            "email": "mike.rodriguez@email.com", 
            "phone": "(407) 555-0456",
            "address": {
                "street": "456 Oak Avenue",
                "city": "Winter Park",
                "state": "FL",
                "zipCode": "32789"
            },
            "pets": [{
                "name": "Luna",
                "breed": "Border Collie",
                "age": 2,
                "weight": 45,
                "specialInstructions": "Gets anxious, needs gentle handling"
            }, {
                "name": "Max",
                "breed": "German Shepherd",
                "age": 5,
                "weight": 80,
                "specialInstructions": "Well-behaved, no special needs"
            }],
            "preferences": {
                "preferredTimeSlots": ["afternoon"],
                "recurringService": false
            }
        }' > /dev/null && echo "     ✅ Mike Rodriguez, Luna & Max created"

    # Client 3: Jennifer Chen
    echo "   Creating client: Jennifer Chen..."
    curl -s -X POST "$API_BASE/clients" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{
            "firstName": "Jennifer",
            "lastName": "Chen",
            "email": "jennifer.chen@email.com",
            "phone": "(407) 555-0789", 
            "address": {
                "street": "789 Maple Drive",
                "city": "Kissimmee",
                "state": "FL",
                "zipCode": "34741"
            },
            "pets": [{
                "name": "Whiskers",
                "breed": "Persian Cat",
                "age": 4,
                "weight": 12,
                "specialInstructions": "Long-haired, needs thorough brushing"
            }],
            "preferences": {
                "preferredTimeSlots": ["morning", "afternoon"],
                "recurringService": true,
                "recurringFrequency": "bi-weekly"
            }
        }' > /dev/null && echo "     ✅ Jennifer Chen & Whiskers created"
}

# Function to create demo appointments
create_demo_appointments() {
    echo ""
    echo "📅 Creating demo appointments..."
    
    # Get tomorrow's date
    TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)
    
    echo "   Creating appointment for tomorrow ($TOMORROW)..."
    curl -s -X POST "$API_BASE/appointments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{
            \"clientEmail\": \"sarah.johnson@email.com\",
            \"petName\": \"Buddy\",
            \"serviceType\": \"Full Grooming\",
            \"scheduledDate\": \"$TOMORROW\",
            \"scheduledTime\": \"10:00\",
            \"estimatedDuration\": 90,
            \"address\": {
                \"street\": \"123 Pine Street\",
                \"city\": \"Orlando\", 
                \"state\": \"FL\",
                \"zipCode\": \"32801\"
            },
            \"notes\": \"Demo appointment - Full grooming for Buddy\"
        }" > /dev/null && echo "     ✅ Appointment created for Sarah & Buddy"

    # Appointment 2
    curl -s -X POST "$API_BASE/appointments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{
            \"clientEmail\": \"mike.rodriguez@email.com\",
            \"petName\": \"Luna\",
            \"serviceType\": \"Bath & Brush\",
            \"scheduledDate\": \"$TOMORROW\",
            \"scheduledTime\": \"14:00\",
            \"estimatedDuration\": 60,
            \"address\": {
                \"street\": \"456 Oak Avenue\",
                \"city\": \"Winter Park\",
                \"state\": \"FL\", 
                \"zipCode\": \"32789\"
            },
            \"notes\": \"Demo appointment - Gentle handling for Luna\"
        }" > /dev/null && echo "     ✅ Appointment created for Mike & Luna"
}

# Function to display final status
show_status() {
    echo ""
    echo "🎉 Demo setup complete!"
    echo ""
    echo "👤 Admin Account:"
    echo "   Email: $ADMIN_EMAIL"
    echo "   Password: $ADMIN_PASSWORD"
    echo ""
    echo "🐕 Demo Clients Created:"
    echo "   • Sarah Johnson (Buddy - Golden Retriever)"
    echo "   • Mike Rodriguez (Luna & Max - Border Collie & German Shepherd)"
    echo "   • Jennifer Chen (Whiskers - Persian Cat)"
    echo ""
    echo "📅 Demo Appointments:"
    echo "   • Tomorrow: Sarah & Buddy at 10:00 AM"
    echo "   • Tomorrow: Mike & Luna at 2:00 PM"
    echo ""
    echo "🚀 Ready to test your application:"
    echo "   1. Visit: http://localhost:5174/"
    echo "   2. Login with admin credentials above"
    echo "   3. Explore the dashboard and features"
    echo ""
    echo "✨ Your CelysPets Mobile Grooming business is ready!"
}

# Main execution
check_servers
setup_admin
create_demo_clients
create_demo_appointments
show_status
