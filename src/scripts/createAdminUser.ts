// Script to create admin user in Supabase Auth
// Run this once to create the admin user
import { supabase } from '../config/supabase';

async function createAdminUser() {
  console.log('🔧 Creating admin user in Supabase Auth...');
  
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@celyspets.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User',
        role: 'admin'
      }
    });

    if (error) {
      console.error('❌ Failed to create admin user:', error);
      return;
    }

    console.log('✅ Admin user created successfully:', data.user?.email);
    console.log('👤 User ID:', data.user?.id);
    
    // Now update the user_profiles table with the correct ID
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ 
        id: data.user?.id,
        updated_at: new Date().toISOString() 
      })
      .eq('email', 'admin@celyspets.com');

    if (profileError) {
      console.error('⚠️  Failed to update profile ID:', profileError);
    } else {
      console.log('✅ Profile updated with correct Auth ID');
    }

  } catch (err) {
    console.error('❌ Error creating admin user:', err);
  }
}

// Run the script
createAdminUser();