const mysql = require('mysql2/promise');

async function addTestAppointments() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Papaoso97.',
    database: 'celyspets_celypets'
  });

  try {
    console.log('Connected to MySQL database');

    // First, ensure we have a client record for the test user
    const [existingClient] = await connection.execute(
      'SELECT id FROM clients WHERE email = ?',
      ['client@celyspets.com']
    );

    let clientId;
    if (existingClient.length === 0) {
      // Create a client record
      const [result] = await connection.execute(
        'INSERT INTO clients (name, email, phone, address, pets, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        ['Test Client', 'client@celyspets.com', '555-123-4567', '123 Test St, Miami, FL 33101', JSON.stringify([]), '']
      );
      clientId = result.insertId;
      console.log('Created client record with ID:', clientId);
    } else {
      clientId = existingClient[0].id;
      console.log('Using existing client with ID:', clientId);
    }

    // Add some test appointments
    const appointments = [
      {
        clientId: clientId,
        groomerId: null,
        services: JSON.stringify(['Full Grooming Package']),
        date: '2024-12-15',
        time: '10:00 AM',
        status: 'completed',
        notes: 'Regular grooming session completed successfully',
        totalAmount: 85.00
      },
      {
        clientId: clientId,
        groomerId: null,
        services: JSON.stringify(['Bath & Brush']),
        date: '2024-12-20',
        time: '2:00 PM',
        status: 'confirmed',
        notes: 'Standard bath and brush service',
        totalAmount: 45.00
      },
      {
        clientId: clientId,
        groomerId: null,
        services: JSON.stringify(['Nail Trimming']),
        date: '2024-11-28',
        time: '11:30 AM',
        status: 'completed',
        notes: 'Quick nail trim',
        totalAmount: 25.00
      },
      {
        clientId: clientId,
        groomerId: null,
        services: JSON.stringify(['De-shedding Treatment']),
        date: '2025-01-10',
        time: '9:00 AM',
        status: 'pending',
        notes: 'Winter de-shedding session',
        totalAmount: 65.00
      }
    ];

    // Clear existing appointments for this client first
    await connection.execute('DELETE FROM appointments WHERE clientId = ?', [clientId]);
    console.log('Cleared existing appointments');

    // Insert new appointments
    for (const appointment of appointments) {
      const [result] = await connection.execute(
        'INSERT INTO appointments (clientId, groomerId, services, date, time, status, notes, totalAmount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [
          appointment.clientId,
          appointment.groomerId,
          appointment.services,
          appointment.date,
          appointment.time,
          appointment.status,
          appointment.notes,
          appointment.totalAmount
        ]
      );
      console.log(`Created appointment with ID: ${result.insertId} - ${appointment.services} on ${appointment.date}`);
    }

    console.log('✅ Test appointments added successfully!');

  } catch (error) {
    console.error('Error adding test appointments:', error);
  } finally {
    await connection.end();
  }
}

addTestAppointments();
