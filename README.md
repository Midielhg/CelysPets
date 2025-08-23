## ✅ Production Deployment - LIVE

**Status: DEPLOYED AND WORKING** 🎉

### Live Application:
- **Website**: https://celyspets.com
- **API**: https://celyspets.com/api.php
- **Admin Login**: admin@celyspets.com / admin123

To create the production build and prepare for deployment:

```bash
# 1. Build the frontend
npm run build

# 2. Prepare deployment folder
rm -rf simple-static-deploy
mkdir -p simple-static-deploy

# 3. Copy frontend files
cp dist/index.html dist/vite.svg simple-static-deploy/
cp -r dist/assets simple-static-deploy/

# 4. Copy API backend (with localhost database settings)
cp celyspets-php-api.php simple-static-deploy/api.php
```

**Upload the `simple-static-deploy` folder contents to your hosting root directory.**

### Testing & Debugging URLs:
- **Health Check**: `https://celyspets.com/api.php` 
- **Admin User Test**: `https://celyspets.com/api.php/test/admin`
- **Reset Admin Password**: `POST https://celyspets.com/api.php/setup/reset-admin-password`
- **Login**: `admin@celyspets.com` / `admin123`

### Database Settings (Production):
- **Host**: localhost
- **Database**: celyspets_celypets  
- **Username**: celyspets_celypets

To start the servers and front end run these two commands on different terminals
cd server && npm run dev

cd "/Users/midielhenriquez/Library/Mobile Documents/com~apple~CloudDocs/Documents/Investments/CelysPets Inc/dev/server" && npm run dev

cd "/Users/midielhenriquez/Library/Mobile Documents/com~apple~CloudDocs/Documents/Investments/CelysPets Inc/dev" && npm run dev:client


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
