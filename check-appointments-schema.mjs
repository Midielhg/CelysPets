// Check appointments schema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uizkllezgwpxolcbkaiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemtsbGV6Z3dweG9sY2JrYWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NDk5NTIsImV4cCI6MjA3MzEyNTk1Mn0.7f1BjfumqFvgAM8Z0jI_TjFX1AIANQ2CyAUToeOdM8c';

const supabase = createClient(supabaseUrl, supabaseKey);

// Get sample appointment to see structure
const { data: appointments, error: apptError } = await supabase
  .from('appointments')
  .select('*')
  .limit(1);

if (apptError) {
  console.error('Error fetching appointments:', apptError);
} else if (appointments && appointments.length > 0) {
  console.log('Sample appointment structure:');
  console.log(JSON.stringify(appointments[0], null, 2));
} else {
  console.log('No appointments found - checking table exists...');
  
  // Try a simple insert to see required fields
  const { error: insertError } = await supabase
    .from('appointments')
    .insert({})
    .select();
    
  if (insertError) {
    console.log('Table structure hints from error:', insertError.message);
  }
}