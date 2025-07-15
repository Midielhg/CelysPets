// Demo Data Setup for CelysPets Mobile Grooming
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
let authToken = '';

async function setupDemoData() {
  console.log('🐕 Setting up CelysPets Mobile Grooming Demo Data...\n');

  try {
    // Step 1: Register admin user
    console.log('1. Creating admin user...');
    const adminUser = {
      firstName: 'Maria',
      lastName: 'Rodriguez',
      email: 'maria@celypets.com',
      password: 'CelysPets123!',
      role: 'admin'
    };

    const userResponse = await axios.post(`${API_BASE}/auth/register`, adminUser);
    authToken = userResponse.data.token;
    console.log('✅ Admin user created:', userResponse.data.user.email);

    // Step 2: Create sample clients
    console.log('\n2. Creating sample clients...');
    const clients = [
      {
        firstName: 'Jennifer',
        lastName: 'Smith',
        email: 'jennifer.smith@email.com',
        phone: '(407) 555-0123',
        address: {
          street: '1234 Oak Avenue',
          city: 'Orlando',
          state: 'FL',
          zipCode: '32801'
        },
        pets: [
          {
            name: 'Buddy',
            breed: 'Golden Retriever',
            size: 'large',
            specialInstructions: 'Very friendly, loves treats'
          }
        ],
        preferences: {
          preferredDays: ['Monday', 'Tuesday', 'Wednesday'],
          preferredTimeSlots: ['09:00', '10:00', '11:00'],
          recurring: {
            frequency: 'monthly',
            day: 'Monday',
            time: '09:00'
          }
        }
      },
      {
        firstName: 'Michael',
        lastName: 'Johnson',
        email: 'mike.johnson@email.com',
        phone: '(407) 555-0456',
        address: {
          street: '5678 Pine Street',
          city: 'Winter Park',
          state: 'FL',
          zipCode: '32789'
        },
        pets: [
          {
            name: 'Luna',
            breed: 'Border Collie',
            size: 'medium',
            specialInstructions: 'Sensitive to loud noises'
          },
          {
            name: 'Max',
            breed: 'Labrador Mix',
            size: 'large',
            specialInstructions: 'Needs extra attention for matted fur'
          }
        ],
        preferences: {
          preferredDays: ['Tuesday', 'Thursday', 'Friday'],
          preferredTimeSlots: ['10:00', '11:00', '14:00'],
          recurring: {
            frequency: 'biweekly',
            day: 'Thursday',
            time: '11:00'
          }
        }
      },
      {
        firstName: 'Sarah',
        lastName: 'Davis',
        email: 'sarah.davis@email.com',
        phone: '(407) 555-0789',
        address: {
          street: '9012 Maple Drive',
          city: 'Altamonte Springs',
          state: 'FL',
          zipCode: '32714'
        },
        pets: [
          {
            name: 'Bella',
            breed: 'Poodle',
            size: 'medium',
            specialInstructions: 'Requires specific cut style, very well-behaved'
          }
        ],
        preferences: {
          preferredDays: ['Wednesday', 'Friday', 'Saturday'],
          preferredTimeSlots: ['13:00', '14:00', '15:00'],
          recurring: {
            frequency: 'monthly',
            day: 'Friday',
            time: '14:00'
          }
        }
      }
    ];

    for (const client of clients) {
      const clientResponse = await axios.post(`${API_BASE}/clients`, client, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(`✅ Client created: ${client.firstName} ${client.lastName} (${client.pets.length} pets)`);
    }

    // Step 3: Create sample appointments
    console.log('\n3. Creating sample appointments...');
    
    // Get the created clients
    const clientsResponse = await axios.get(`${API_BASE}/clients`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const createdClients = clientsResponse.data;

    const appointments = [
      {
        clientId: createdClients[0]._id,
        petId: createdClients[0].pets[0]._id,
        scheduledDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        timeSlot: '09:00',
        services: ['full-groom', 'nail-trim'],
        estimatedDuration: 90,
        status: 'scheduled',
        notes: 'First appointment with Buddy - full grooming service',
        pricing: {
          basePrice: 85,
          additionalServices: 15,
          total: 100
        }
      },
      {
        clientId: createdClients[1]._id,
        petId: createdClients[1].pets[0]._id,
        scheduledDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
        timeSlot: '11:00',
        services: ['bath-brush', 'nail-trim'],
        estimatedDuration: 60,
        status: 'scheduled',
        notes: 'Luna is sensitive to noise - use quiet equipment',
        pricing: {
          basePrice: 65,
          additionalServices: 10,
          total: 75
        }
      },
      {
        clientId: createdClients[2]._id,
        petId: createdClients[2].pets[0]._id,
        scheduledDate: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
        timeSlot: '14:00',
        services: ['full-groom', 'styling'],
        estimatedDuration: 120,
        status: 'scheduled',
        notes: 'Bella needs specific poodle cut - show style',
        pricing: {
          basePrice: 95,
          additionalServices: 25,
          total: 120
        }
      }
    ];

    for (const appointment of appointments) {
      try {
        const appointmentResponse = await axios.post(`${API_BASE}/appointments`, appointment, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log(`✅ Appointment created for ${appointment.timeSlot} on ${appointment.scheduledDate.split('T')[0]}`);
      } catch (error) {
        console.log(`⚠️ Appointment creation skipped: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 Demo data setup complete!');
    console.log('\n📋 Login Credentials:');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${adminUser.password}`);
    console.log('\n🌐 Visit: http://localhost:5174');
    console.log('\n✨ Your CelysPets Mobile Grooming system is ready for testing!');

  } catch (error) {
    console.error('❌ Error setting up demo data:', error.response?.data || error.message);
  }
}

setupDemoData();
