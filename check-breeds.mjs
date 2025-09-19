// Check breeds status
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uizkllezgwpxolcbkaiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemtsbGV6Z3dweG9sY2JrYWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NDk5NTIsImV4cCI6MjA3MzEyNTk1Mn0.7f1BjfumqFvgAM8Z0jI_TjFX1AIANQ2CyAUToeOdM8c';

const supabase = createClient(supabaseUrl, supabaseKey);

const { data, error } = await supabase
  .from('breeds')
  .select('*')
  .order('name');

if (error) {
  console.error('Error:', error);
} else {
  console.log(`Total breeds: ${data?.length}`);
  data?.forEach((breed, index) => {
    console.log(`${index + 1}. ID: ${breed.id}, Name: ${breed.name}, Species: ${breed.species}`);
  });
  
  // Check duplicates
  const nameCount = {};
  data?.forEach(breed => {
    nameCount[breed.name] = (nameCount[breed.name] || 0) + 1;
  });

  const duplicates = Object.entries(nameCount).filter(([name, count]) => count > 1);
  
  if (duplicates.length === 0) {
    console.log('\n🎉 No duplicate breed names found!');
  } else {
    console.log('\n❌ Duplicates still exist:');
    duplicates.forEach(([name, count]) => {
      console.log(`- ${name}: ${count} entries`);
    });
  }
}