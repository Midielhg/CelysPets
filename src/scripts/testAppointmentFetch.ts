// Test script to verify appointment fetching works after foreign key fix
import { AppointmentService } from '../services/appointmentService';

async function testAppointmentFetch() {
  console.log('🧪 Testing appointment fetch after foreign key fix...');
  
  try {
    const appointments = await AppointmentService.getAll();
    console.log('✅ Success! Fetched', appointments.length, 'appointments');
    console.log('📊 First appointment sample:', appointments[0]);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to fetch appointments:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      hint: error.hint
    });
    return false;
  }
}

// Run the test
testAppointmentFetch()
  .then((success) => {
    console.log('🏁 Test completed:', success ? 'PASSED' : 'FAILED');
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error);
  });