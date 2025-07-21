# 🗄️ Database Setup Guide for CelysPets

## 🎯 Quick Setup for Hosting Providers

### 1. **Database Creation**
```sql
-- Database name: celyspets_celypets
-- Charset: utf8mb4
-- Collation: utf8mb4_unicode_ci
```

### 2. **User Creation**
```sql
-- Username: celyspets_celypets
-- Password: hY9cq6KT3$
-- Grant: ALL PRIVILEGES on celyspets_celypets.*
```

### 3. **Run Database Setup**
Upload and run: `/server/setup-mysql-tables.sql`

### 4. **Update Environment**
```bash
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=celyspets_celypets
MYSQL_USERNAME=celyspets_celypets
MYSQL_PASSWORD=hY9cq6KT3$
```

### 5. **Deploy Files**
- Frontend: Upload `dist/` folder contents
- Backend: Upload `server/dist/` folder as API
- Environment: Upload `.env` file

### 6. **Test Connection**
```bash
npm run db:test:mysql
```
