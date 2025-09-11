# 🚀 CelysPets Supabase Migration Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization and name your project: `celyspets-production`
4. Set a strong database password
5. Choose a region close to your users
6. Click "Create new project"

## Step 2: Get Your Project Credentials

Once your project is created:

1. Go to Project Settings > API
2. Copy your project URL and anon key:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 3: Update Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update your `.env` file:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

## Step 4: Set Up Database Schema

In your Supabase dashboard, go to the SQL Editor and run these files in order:

### 1. Create Tables and Types
```sql
-- Copy and paste the contents of supabase/001-create-tables.sql
```

### 2. Set Up Row Level Security
```sql
-- Copy and paste the contents of supabase/002-row-level-security.sql
```

### 3. Add Seed Data
```sql
-- Copy and paste the contents of supabase/003-seed-data.sql
```

### 4. Add Helper Functions
```sql
-- Copy and paste the contents of supabase/004-functions.sql
```

## Step 5: Update Your Application

The application is already prepared for Supabase! All you need to do is:

1. Update your environment variables (done in Step 3)
2. Test the connection by running the development server:
   ```bash
   npm run dev:client
   ```

## Step 6: Deploy to Production

### Option A: Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Option B: Deploy to Netlify

1. Build your project:
   ```bash
   npm run build
   ```
2. Upload the `dist` folder to Netlify
3. Set environment variables in Netlify dashboard

## 🎉 Benefits You'll Get Immediately

1. **No more production database configuration issues**
2. **Same database URL for development and production**
3. **Automatic SSL and security**
4. **Real-time subscriptions (optional)**
5. **Automatic backups**
6. **Built-in authentication**
7. **Edge functions for complex logic**

## 🔧 Troubleshooting

### "Failed to fetch" errors
- Check your environment variables are set correctly
- Verify your Supabase project URL and anon key
- Make sure RLS policies are set up correctly

### Authentication issues
- Ensure you have the admin user created (from seed data)
- Check the email and password in the seed data

### Database connection errors
- Verify all SQL scripts ran successfully
- Check the Supabase logs in your dashboard

## 🚀 Next Steps After Migration

1. **Add real-time features**: Subscribe to table changes for live updates
2. **Implement proper authentication**: Use Supabase Auth instead of custom tokens
3. **Add file storage**: Use Supabase Storage for pet photos
4. **Edge functions**: Move complex business logic to serverless functions
5. **Analytics**: Track usage and performance

## 📞 Support

If you run into any issues:
1. Check the Supabase documentation
2. Review the console logs for specific error messages
3. Verify all environment variables are correct
4. Make sure all SQL scripts executed without errors

Happy migrating! 🎯
