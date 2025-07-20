# 🔧 DATABASE CONNECTION FIX - Local Hosting Setup

## 🎯 UNDERSTANDING YOUR SETUP
You've uploaded files via SFTP to your web hosting server and want to use the **local MySQL database** on that same server, not a remote database connection.

**Configuration for localhost database:**
```bash
MYSQL_HOST=localhost
MYSQL_DATABASE=celyspets_celypets  
MYSQL_USERNAME=celyspets_celypets
MYSQL_PASSWORD=3r5t1jQLE@
MYSQL_PORT=3306
```

**✅ NO IP WHITELISTING NEEDED** - localhost connections don't require IP restrictions!

---

## 🔧 DUAL ENVIRONMENT SETUP

### **Development (Remote Database):**
```bash
cd server
npm run dev:remote  # Uses remote MySQL: mysql.us.cloudlogin.co
# ⚠️ This needs IP whitelisting (73.125.149.204) - OPTIONAL for development only
```

### **Production (Local Database):**
```bash
./build-production.sh  # Uses localhost MySQL on hosting server
# ✅ No IP whitelisting needed - connects via localhost
```

---

## 🚨 IMPORTANT CLARIFICATION

**The IP whitelisting issue (73.125.149.204) is ONLY for:**
- Remote database connections during development
- When using `mysql.us.cloudlogin.co`

**For your SFTP deployment with localhost database:**
- ✅ No IP whitelisting required
- ✅ No remote connection issues
- ✅ Database is on the same server as your application

---

## 🏗️ SETUP DATABASE ON YOUR HOSTING SERVER

### **3.1: Create Database via cPanel/Control Panel**

1. **Login to your hosting control panel** (cPanel/Plesk/DirectAdmin)
2. **Go to "MySQL Databases"**
3. **Create database:** `celyspets_celypets`
4. **Create user:** `celyspets_celypets` with password `3r5t1jQLE@`
5. **Grant ALL privileges** to the user for that database

### **3.2: Import Database Schema**

1. **Go to "phpMyAdmin" in your control panel**
2. **Select the `celyspets_celypets` database**
3. **Click "Import" tab**
4. **Upload the file:** `setup-localhost-database.sql`
5. **Click "Go" to import**

---

## 📁 UPLOAD FILES VIA SFTP

### **Upload Structure:**
```
your-website-root/
├── index.html (from /dist/)
├── assets/ (from /dist/assets/)
├── api/ (backend files)
│   ├── index.js (from /server/dist/)
│   ├── config/ (from /server/dist/config/)
│   ├── models/ (from /server/dist/models/)
│   ├── routes/ (from /server/dist/routes/)
│   ├── middleware/ (from /server/dist/middleware/)
│   ├── node_modules/ (upload /server/node_modules/)
│   ├── package.json (from /server/)
│   └── .env (copy from /server/.env.deploy - localhost config)
```

---

## 🎯 START APPLICATION ON SERVER

### **SSH into your server and run:**
```bash
cd /path/to/website/api
node index.js
```

### **Or setup as a service/daemon** (ask your hosting provider)

---

## ✅ TESTING

### **Production Testing (Localhost DB):**
```bash
# After uploading to server
curl https://yourdomain.com/api/health
curl https://yourdomain.com/api/appointments
```

### **Admin Login Test:**
- URL: https://yourdomain.com/dev/
- Email: admin@celyspets.com
- Password: admin123

---

## 🔧 TROUBLESHOOTING

### **Database Connection Issues:**
```bash
# Test database connection on server
node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: 'localhost',
  user: 'celyspets_celypets',
  password: '3r5t1jQLE@',
  database: 'celyspets_celypets'
}).then(() => console.log('✅ Localhost DB connected'))
.catch(err => console.error('❌ Error:', err.message));
"
```

### **File Permissions:**
```bash
# Make sure files are executable
chmod +x index.js
chmod 755 config/ models/ routes/ middleware/
```

---

## 📋 SUMMARY

### **For Development (Optional):**
- IP whitelisting needed for remote database (mysql.us.cloudlogin.co)
- Add IP: 73.125.149.204 to remote database whitelist
- This is ONLY if you want to use `npm run dev:remote`

### **For Production (Your SFTP deployment):**
- ✅ NO IP whitelisting needed
- ✅ Uses localhost database on same server
- ✅ No network restrictions
- ✅ Login issues will be resolved with localhost setup

**Your SFTP deployment with localhost database will work without any IP whitelisting!** 🎉
