# 🗄️ MySQL Hosting Setup Guide
# Connect Your App to Your Hosting Provider's MySQL Database

## 🎯 **Quick Setup Checklist**

### **1️⃣ Get MySQL Credentials from Your Hosting Provider**

Most hosting providers give you:
- **Host**: `mysql.yourhost.com` or IP address
- **Port**: `3306` (default)
- **Database Name**: `cely_pets_mobile_grooming`
- **Username**: Your MySQL username
- **Password**: Your MySQL password

### **2️⃣ Update Environment Variables**

Copy your hosting provider's MySQL credentials to `.env.mysql`:

```bash
# Your hosting provider's MySQL details
MYSQL_HOST=mysql.yourhost.com
MYSQL_PORT=3306
MYSQL_DATABASE=cely_pets_mobile_grooming
MYSQL_USERNAME=your_username
MYSQL_PASSWORD=your_password

# Keep these the same
JWT_SECRET=cely-pets-mobile-grooming-super-secure-jwt-secret-production-2024-v1
NODE_ENV=production
PORT=3001
GOOGLE_MAPS_API_KEY=AIzaSyAKlC3v4GgU1jRhFdungYa38hbDHm0qQx0
```

### **3️⃣ Create Database Tables**

Run the SQL script (`database-setup.sql`) in your hosting provider's MySQL panel:

1. **Login to your hosting control panel**
2. **Go to MySQL/Database section**
3. **Open phpMyAdmin or MySQL console**
4. **Run the SQL script** to create tables

### **4️⃣ Test MySQL Connection**

```bash
# Test if MySQL connection works
npm run db:test:mysql
```

### **5️⃣ Deploy with MySQL**

For development:
```bash
npm run dev:mysql
```

For production:
```bash
npm run build
npm run start:prod:mysql
```

## 🌐 **Popular Hosting Providers MySQL Setup**

### **cPanel Hosting (Most Common)**
1. **Login to cPanel**
2. **MySQL Databases** → Create database
3. **Add user** → Grant all privileges
4. **Note down**: host, database name, username, password

### **HostGator/Bluehost/GoDaddy**
1. **Hosting Control Panel**
2. **Databases** → **MySQL**
3. **Create database** → `cely_pets_mobile_grooming`
4. **Create user** → Grant permissions
5. **Use**: `localhost` or provided host

### **SiteGround**
1. **Site Tools** → **MySQL**
2. **Create database**
3. **Manage** → Run SQL script
4. **Host**: Usually `localhost`

### **A2 Hosting**
1. **cPanel** → **MySQL Databases**
2. **Create database** and **user**
3. **phpMyAdmin** → Import SQL script
4. **Host**: `localhost` or provided

## 🔧 **Deployment Steps**

### **Step 1: Upload Files**
Upload your `server` folder to your hosting provider.

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Set Environment Variables**
Create `.env` file with your MySQL credentials.

### **Step 4: Build Application**
```bash
npm run build
```

### **Step 5: Start Application**
```bash
npm run start:prod:mysql
```

## 📊 **Database Schema (Auto-Created)**

The app will automatically create these tables:
- ✅ **users** - Admin and client accounts
- ✅ **clients** - Customer information and pets
- ✅ **appointments** - Booking and scheduling

## 🆓 **Free MySQL Hosting Options**

### **Option 1: Your Current Provider**
- Most hosting providers include MySQL for free
- Usually unlimited databases
- Perfect for small businesses

### **Option 2: Free MySQL Hosts**
- **FreeSQLDatabase.com** - 5MB free
- **db4free.net** - 200MB free
- **Aiven** - 1 month free trial

### **Option 3: Upgrade Existing Hosting**
- Add MySQL addon (usually $2-5/month)
- More reliable than free options
- Better performance

## 🔍 **Testing Your Setup**

### **1. Test Database Connection**
```bash
npm run db:test:mysql
```

### **2. Check Tables Were Created**
Login to phpMyAdmin and verify tables exist:
- `users`
- `clients` 
- `appointments`

### **3. Test API Endpoints**
```bash
# Health check
curl https://yourdomain.com/health

# Test API
curl https://yourdomain.com/api/auth/register
```

## 🚀 **Production Deployment**

### **Frontend Update**
Update your frontend's API URL to point to your hosting provider:

```javascript
// In your React app
const API_URL = 'https://yourdomain.com/api';
```

### **CORS Update**
Add your domain to the CORS origins in `indexMySQL.ts`:

```javascript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];
```

## 💡 **Pro Tips**

### **1. Database Optimization**
- Use indexes for faster queries (already included)
- Regular backups via hosting control panel
- Monitor database size

### **2. Security**
- Use strong MySQL passwords
- Limit database user permissions
- Enable SSL if available

### **3. Performance**
- Use connection pooling (already configured)
- Monitor slow queries
- Optimize JSON fields if needed

## 📈 **Migration Benefits**

### **✅ Advantages of MySQL vs MongoDB**
- **Free with most hosting providers**
- **Better hosting provider support**
- **More familiar to developers**
- **Better performance for small datasets**
- **Easier backups and maintenance**

### **📊 What You Keep**
- All existing functionality
- Same API endpoints
- Same frontend code
- All features work the same

---

**🎉 Total Cost: $0 extra (included with hosting)**
**⏱️ Setup Time: ~15 minutes**
**🔧 Migration: Seamless**

Your mobile grooming app now works with MySQL - perfect for standard hosting providers!
