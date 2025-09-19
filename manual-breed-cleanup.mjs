// Manual breed cleanup script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uizkllezgwpxolcbkaiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemtsbGV6Z3dweG9sY2JrYWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NDk5NTIsImV4cCI6MjA3MzEyNTk1Mn0.7f1BjfumqFvgAM8Z0jI_TjFX1AIANQ2CyAUToeOdM8c';

const supabase = createClient(supabaseUrl, supabaseKey);

// Manually delete specific duplicate IDs one by one
async function removeDuplicates() {
  console.log('Starting manual duplicate removal...');

  // Target the higher ID numbers for removal
  const toDelete = [17, 18, 19, 20];
  
  for (const id of toDelete) {
    console.log(`Deleting breed with ID ${id}...`);
    
    const { data, error } = await supabase
      .from('breeds')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      console.error(`Error deleting ID ${id}:`, error);
    } else {
      console.log(`✅ Deleted breed with ID ${id}:`, data);
    }
  }

  // Verify results
  console.log('\nVerifying remaining breeds...');
  
  const { data: remaining, error: fetchError } = await supabase
    .from('breeds')
    .select('id, name, species')
    .order('name');

  if (fetchError) {
    console.error('Error fetching remaining breeds:', fetchError);
    return;
  }

  console.log('Remaining breeds:');
  remaining?.forEach(breed => {
    console.log(`- ID: ${breed.id}, Name: ${breed.name}, Species: ${breed.species}`);
  });

  // Check for duplicates
  const names = remaining?.map(b => b.name) || [];
  const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
  
  if (duplicateNames.length === 0) {
    console.log('\n🎉 No duplicates found!');
  } else {
    console.log('\n❌ Still have duplicates:', [...new Set(duplicateNames)]);
  }
}

removeDuplicates().catch(console.error);