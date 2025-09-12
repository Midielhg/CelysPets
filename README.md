## ✅ Production Deployment - LIVE

**Status: DEPLOYED AND WORKING** 🎉

### Live Application:
- **Website**: https://celyspets.com
- **API**: https://celyspets.com/api.php
- **Admin Login**: admin@celyspets.com / admin123

## 🗺️ Google Maps Integration

The Agenda view includes an interactive route map powered by Google Maps. To enable this feature:

### 1. Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Create a new project or select existing one
3. Enable these APIs:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### 2. Configure Environment
1. Copy `.env.example` to `.env`
2. Add your API key:
```bash
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Features
- **Route Optimization**: Shows appointments in optimal order
- **Interactive Map**: Click markers for appointment details
- **Travel Time**: Displays estimated travel between stops
- **Fuel Estimates**: Calculates fuel consumption and costs

**Note**: Without the API key, the map will show a fallback view with route information.

## 🚀 Development Setup

### Environment Configuration

**IMPORTANT:** You must set up the correct environment variables for production deployment.

#### For Production:
1. Copy `.env.production.example` to `.env.production` 
2. Set the API URL to your PHP backend:
```bash
VITE_API_URL=https://celyspets.com/api.php
```

#### For Development:
1. Copy `.env.development.example` to `.env.development`
2. Set the API URL to your Node.js backend:
```bash
VITE_API_URL=http://localhost:5002/api
```

### Building for Production

To create the production build and prepare for deployment:

```bash
# 1. Ensure you have the correct .env.production file
cp .env.production.example .env.production
# Edit .env.production with your production API URL

# 2. Build the frontend with production environment
npm run build

# 3. Prepare deployment folder
rm -rf simple-static-deploy
mkdir -p simple-static-deploy

# 4. Copy frontend files
cp dist/index.html dist/vite.svg simple-static-deploy/
cp -r dist/assets simple-static-deploy/

# 5. Copy API backend (with production database settings)
cp celyspets-php-api.php simple-static-deploy/api.php
```

**Upload the `simple-static-deploy` folder contents to your hosting root directory.**

### ✅ Fixed Production Issue

**Previous Issue**: The booking page was crashing because the frontend was making API calls to hardcoded Node.js localhost URLs (`http://localhost:5001`, `http://localhost:5002`) which don't exist in production.

**Solution Applied**:
1. ✅ Fixed all hardcoded localhost URLs to use the `apiUrl()` function
2. ✅ Created proper environment variable configuration (`.env.production`)  
3. ✅ Updated build process to use production environment variables
4. ✅ Verified the built frontend now correctly points to `https://celyspets.com/api.php`

**Note**: You must rebuild and redeploy the application for these fixes to take effect.

### Testing & Debugging URLs:
- **Health Check**: `https://celyspets.com/api.php` 
- **Admin User Test**: `https://celyspets.com/api.php/test/admin`
- **Dashboard Stats**: `https://celyspets.com/api.php/dashboard/stats`
- **Pricing Breeds**: `https://celyspets.com/api.php/pricing/breeds`
- **Additional Services**: `https://celyspets.com/api.php/pricing/additional-services`
- **Reset Admin Password**: `POST https://celyspets.com/api.php/setup/reset-admin-password`
- **Login**: `admin@celyspets.com` / `admin123`

### Database Settings (Production):
- **Host**: localhost
- **Database**: celyspets_celypets  
- **Username**: celyspets_celypets

To start the servers and front end run these two commands on different terminals
cd server && npm run dev
npm run dev:client

cd "/Users/midielhenriquez/Library/Mobile Documents/com~apple~CloudDocs/Documents/Investments/CelysPets Inc/dev/server" && npm run dev

cd "/Users/midielhenriquez/Library/Mobile Documents/com~apple~CloudDocs/Documents/Investments/CelysPets Inc/dev" && npm run dev:client

### Latest Features:
- **Route Optimization**: Enhanced with manual gas price and vehicle MPG input
- **Crash Prevention**: Added ErrorBoundary component and comprehensive error handling
- **Frontend**: Running on http://localhost:5175/
- **Backend API**: Running on http://localhost:5001/


# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
