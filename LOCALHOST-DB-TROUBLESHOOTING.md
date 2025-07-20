# 🔧 LOCALHOST DATABASE CONNECTION TROUBLESHOOTING

## 🎯 **Problem:** Localhost MySQL connection fails after SFTP upload

The remote connection works ✅, but localhost connection fails ❌ on your hosting server.

---

## 🔍 **Common Localhost Database Issues:**

### **1. Database/User Not Created on Server**
Your hosting server might not have the database/user set up yet.

### **2. Wrong Database Credentials**
Localhost credentials might be different from remote credentials.

### **3. MySQL Service Not Running**
MySQL might not be active on your hosting server.

### **4. Wrong Database Host**
Some hosting providers use different hosts like `127.0.0.1` instead of `localhost`.

---

## 🔧 **STEP-BY-STEP TROUBLESHOOTING:**

### **Step 1: Check Your Hosting Provider's Database Info**

**Log into your hosting control panel and check:**
- **Database Name:** Is it exactly `celyspets_celypets`?
- **Username:** Is it exactly `celyspets_celypets`?
- **Password:** Is it exactly `3r5t1jQLE@`?
- **Host:** Is it `localhost` or something else like `127.0.0.1`?

### **Step 2: Create Database via Control Panel**

1. **Go to your hosting control panel** (cPanel/Plesk/DirectAdmin)
2. **Find "MySQL Databases" section**
3. **Create database:** `celyspets_celypets`
4. **Create user:** `celyspets_celypets` with password `3r5t1jQLE@`
5. **Grant ALL privileges** to the user for that database

### **Step 3: Import Database Schema**

1. **Go to "phpMyAdmin" in your control panel**
2. **Select the `celyspets_celypets` database**
3. **Click "Import" tab**
4. **Upload:** `setup-localhost-database.sql`
5. **Click "Go" to import**

### **Step 4: Test Database Connection on Server**

**SSH into your server and test:**
```bash
# Test MySQL connection
mysql -u celyspets_celypets -p3r5t1jQLE@ -h localhost celyspets_celypets
```

**Or create a simple test script:**
```bash
# Create test file
cat > test-db.js << 'EOF'
const mysql = require('mysql2/promise');

async function testDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'celyspets_celypets',
      password: '3r5t1jQLE@',
      database: 'celyspets_celypets'
    });
    console.log('✅ Database connection successful!');
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testDB();
EOF

# Run test
node test-db.js
```

---

## 🔧 **ALTERNATIVE ENVIRONMENT CONFIGURATIONS:**

### **Option A: Try Different Host Values**

**Update your `.env` file on the server with different host options:**

```bash
# Try 127.0.0.1 instead of localhost
MYSQL_HOST=127.0.0.1
MYSQL_DATABASE=celyspets_celypets
MYSQL_USERNAME=celyspets_celypets
MYSQL_PASSWORD=3r5t1jQLE@
MYSQL_PORT=3306
JWT_SECRET=cely-pets-mobile-grooming-super-secure-jwt-secret-production-2024-v1
```

### **Option B: Use Your Hosting Provider's Database Host**

**Some providers use specific hostnames:**
```bash
# Common alternatives
MYSQL_HOST=mysql.yourdomain.com
# OR
MYSQL_HOST=localhost.localdomain
# OR
MYSQL_HOST=db.yourdomain.com
```

### **Option C: Use Socket Connection**

**Some hosting providers require socket connections:**
```bash
MYSQL_HOST=localhost
MYSQL_SOCKET=/var/lib/mysql/mysql.sock
# OR
MYSQL_SOCKET=/tmp/mysql.sock
```

---

## 🔧 **HOSTING-SPECIFIC SOLUTIONS:**

### **For cPanel Hosting:**
- Database name format: `username_dbname`
- User format: `username_user`
- Host: Usually `localhost`

### **For Shared Hosting:**
- Host might be: `127.0.0.1` or a specific hostname
- Port might be different (not 3306)

### **For VPS/Dedicated Server:**
- Make sure MySQL service is running: `systemctl start mysql`
- Check if MySQL is listening: `netstat -an | grep 3306`

---

## 🎯 **QUICK DIAGNOSIS COMMANDS:**

**SSH into your server and run these:**

```bash
# 1. Check if MySQL is running
systemctl status mysql
# OR
service mysql status

# 2. Check MySQL port
netstat -an | grep 3306

# 3. Test MySQL connection
mysql -u root -p

# 4. Show databases
mysql -e "SHOW DATABASES;"

# 5. Check user permissions
mysql -e "SELECT User, Host FROM mysql.user WHERE User='celyspets_celypets';"
```

---

## 🚨 **MOST LIKELY SOLUTIONS:**

### **1. Database Not Created Yet**
**→ Create via control panel + import SQL file**

### **2. Wrong Host**
**→ Try `127.0.0.1` instead of `localhost`**

### **3. Different Credentials**
**→ Check your hosting provider's database section**

### **4. MySQL Not Running**
**→ Contact hosting support to start MySQL service**

---

## 📋 **DEBUGGING CHECKLIST:**

- [ ] Database `celyspets_celypets` exists on server
- [ ] User `celyspets_celypets` exists with correct password
- [ ] User has ALL privileges on the database
- [ ] MySQL service is running on server
- [ ] `.env` file has correct localhost credentials
- [ ] Imported `setup-localhost-database.sql` successfully
- [ ] Tried different host values (`localhost`, `127.0.0.1`)
- [ ] Node.js application can access MySQL libraries

---

## 🔗 **Next Steps:**

1. **Check your hosting control panel database section**
2. **Try the different host configurations above**
3. **Run the test commands on your server**
4. **Contact hosting support if MySQL isn't running**

**Let me know what you find, and I'll help you fix the specific issue!** 🚀
