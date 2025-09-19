#!/usr/bin/env node

/**
 * Cleanup script to remove duplicate breed entries from Supabase database
 * 
 * Duplicates found:
 * - Chihuahua: IDs 1 and 18 (keeping ID 1)
 * - Golden Retriever: IDs 7 and 17 (keeping ID 7) 
 * - Maine Coon: IDs 13 and 20 (keeping ID 13)
 * - Persian: IDs 12 and 19 (keeping ID 12)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uizkllezgwpxolcbkaiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpemtsbGV6Z3dweG9sY2JrYWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NDk5NTIsImV4cCI6MjA3MzEyNTk1Mn0.7f1BjfumqFvgAM8Z0jI_TjFX1AIANQ2CyAUToeOdM8c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicateBreeds() {
  console.log('🧹 Starting duplicate breed cleanup...');

  // IDs to remove (keeping the lower ID number for each duplicate pair)
  const duplicatesToRemove = [17, 18, 19, 20];
  const breedNames = {
    17: 'Golden Retriever',
    18: 'Chihuahua', 
    19: 'Persian',
    20: 'Maine Coon'
  };

  console.log('\nBreeds that will be removed:');
  duplicatesToRemove.forEach(id => {
    console.log(`- ID ${id}: ${breedNames[id]}`);
  });

  // Confirmation prompt
  const readline = await import('readline');
  const rl = readline.default.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const confirmed = await new Promise(resolve => {
    rl.question('\n⚠️  Are you sure you want to proceed? (y/N): ', answer => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });

  rl.close();

  if (!confirmed) {
    console.log('❌ Cleanup cancelled by user');
    return;
  }

  // Perform cleanup
  console.log('\n🗑️  Removing duplicate breeds...');

  for (const breedId of duplicatesToRemove) {
    console.log(`Removing breed ID ${breedId} (${breedNames[breedId]})...`);
    
    const { error } = await supabase
      .from('breeds')
      .delete()
      .eq('id', breedId);

    if (error) {
      console.error(`❌ Error removing breed ID ${breedId}:`, error);
      return;
    }

    console.log(`✅ Successfully removed breed ID ${breedId}`);
  }

  // Verify cleanup
  console.log('\n🔍 Verifying cleanup...');
  
  const { data: remainingBreeds, error: fetchError } = await supabase
    .from('breeds')
    .select('*')
    .order('name');

  if (fetchError) {
    console.error('❌ Error fetching remaining breeds:', fetchError);
    return;
  }

  console.log(`\n✅ Cleanup complete! Remaining breeds: ${remainingBreeds?.length}`);
  
  // Check for any remaining duplicates
  const nameCount = {};
  remainingBreeds?.forEach(breed => {
    nameCount[breed.name] = (nameCount[breed.name] || 0) + 1;
  });

  const remainingDuplicates = Object.entries(nameCount).filter(([name, count]) => count > 1);
  
  if (remainingDuplicates.length === 0) {
    console.log('🎉 No duplicate breed names remaining!');
  } else {
    console.log('⚠️  Remaining duplicates found:');
    remainingDuplicates.forEach(([name, count]) => {
      console.log(`- ${name}: ${count} entries`);
    });
  }

  console.log('\n📋 Final breed list:');
  remainingBreeds?.forEach((breed, index) => {
    console.log(`${index + 1}. ID: ${breed.id}, Name: ${breed.name}, Species: ${breed.species}`);
  });
}

// Run the cleanup
cleanupDuplicateBreeds().catch(console.error);