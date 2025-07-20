import express from 'express';
import { Appointment } from '../models/AppointmentMySQL';
import { Client } from '../models/ClientMySQL';
import { auth } from '../middleware/auth';

const router = express.Router();

// Create appointment (public endpoint for booking)
router.post('/', async (req, res) => {
  try {
    const { client: clientData, services, date, time, notes } = req.body;

    console.log('Creating appointment with data:', { clientData, services, date, time });

    // Create or find client
    let client = await Client.findOne({ 
      where: { email: clientData.email } 
    });
    
    if (!client) {
      // Create new client
      client = await Client.create({
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        pets: clientData.pets || [],
        notes: clientData.notes || null
      });
    } else {
      // Update existing client
      await client.update({
        name: clientData.name,
        phone: clientData.phone,
        address: clientData.address,
        pets: clientData.pets || client.pets,
        notes: clientData.notes || client.notes
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      clientId: client.id,
      services: services,
      date: new Date(date),
      time: time,
      status: 'pending',
      notes: notes || null,
      totalAmount: calculateTotal(services)
    });

    // Fetch the created appointment with client data
    const createdAppointment = await Appointment.findByPk(appointment.id, {
      include: [{ model: Client, as: 'client' }]
    });

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: createdAppointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Failed to create appointment' });
  }
});

// Get all appointments (requires auth)
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all appointments...');
    
    const appointments = await Appointment.findAll({
      include: [{ 
        model: Client, 
        as: 'client' 
      }],
      order: [['date', 'ASC'], ['time', 'ASC']]
    });
    
    console.log(`Found ${appointments.length} appointments`);
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

// Get appointment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [{ model: Client, as: 'client' }]
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Failed to fetch appointment' });
  }
});

// Update appointment status
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await appointment.update({
      status,
      notes: notes || appointment.notes
    });

    // Fetch updated appointment with client data
    const updatedAppointment = await Appointment.findByPk(req.params.id, {
      include: [{ model: Client, as: 'client' }]
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Failed to update appointment' });
  }
});

// Delete appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await appointment.destroy();
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Failed to delete appointment' });
  }
});

// Helper function to calculate total cost
function calculateTotal(services: any[]): number {
  const servicePrices: { [key: string]: number } = {
    'full-groom': 65,
    'bath-brush': 45,
    'nail-trim': 25,
    'teeth-cleaning': 35,
    'flea-treatment': 40
  };

  if (Array.isArray(services)) {
    return services.reduce((total, service) => {
      const serviceId = typeof service === 'string' ? service : service.id || service.name;
      return total + (servicePrices[serviceId] || 0);
    }, 0);
  }

  return 0;
}

export default router;
