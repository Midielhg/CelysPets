const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import the models after environment is loaded
const { User } = require('../dist/models/UserMySQL');
const { Client } = require('../dist/models/ClientMySQL');
const { Appointment } = require('../dist/models/AppointmentMySQL');
const { connectDatabase } = require('../dist/config/database');

async function addTestAppointments() {
  try {
    console.log('Connecting to database...');
    await connectDatabase();
    console.log('Connected to database');

    // Find or create the test client
    const [client, created] = await Client.findOrCreate({
      where: { email: 'client@celyspets.com' },
      defaults: {
        name: 'Test Client',
        email: 'client@celyspets.com',
        phone: '555-123-4567',
        address: '123 Test St, Miami, FL 33101',
        pets: [],
        notes: 'Test client for development'
      }
    });

    console.log(created ? 'Created new client' : 'Found existing client', client.id);

    // Clear existing appointments for this client
    await Appointment.destroy({ where: { clientId: client.id } });
    console.log('Cleared existing appointments');

    // Add test appointments
    const appointments = [
      {
        clientId: client.id,
        services: ['Full Grooming Package'],
        date: new Date('2024-12-15'),
        time: '10:00 AM',
        status: 'completed',
        notes: 'Regular grooming session completed successfully',
        totalAmount: 85.00
      },
      {
        clientId: client.id,
        services: ['Bath & Brush'],
        date: new Date('2024-12-20'),
        time: '2:00 PM',
        status: 'confirmed',
        notes: 'Standard bath and brush service',
        totalAmount: 45.00
      },
      {
        clientId: client.id,
        services: ['Nail Trimming'],
        date: new Date('2024-11-28'),
        time: '11:30 AM',
        status: 'completed',
        notes: 'Quick nail trim',
        totalAmount: 25.00
      },
      {
        clientId: client.id,
        services: ['De-shedding Treatment'],
        date: new Date('2025-01-10'),
        time: '9:00 AM',
        status: 'pending',
        notes: 'Winter de-shedding session',
        totalAmount: 65.00
      }
    ];

    // Create appointments
    for (const appointmentData of appointments) {
      const appointment = await Appointment.create(appointmentData);
      console.log(`Created appointment ${appointment.id}: ${appointmentData.services.join(', ')} on ${appointmentData.date.toDateString()}`);
    }

    console.log('✅ Test appointments added successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error adding test appointments:', error);
    process.exit(1);
  }
}

addTestAppointments();
