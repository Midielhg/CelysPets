import express from 'express';
import { Appointment } from '../models/Appointment';
import { Client } from '../models/Client';
import { auth } from '../middleware/auth';

const router = express.Router();

// Create appointment (public endpoint for booking)
router.post('/', async (req, res) => {
  try {
    const { client: clientData, services, date, time, notes } = req.body;

    // Create or find client
    let client = await Client.findOne({ email: clientData.email });
    if (!client) {
      client = new Client(clientData);
      await client.save();
    } else {
      // Update client information
      Object.assign(client, clientData);
      await client.save();
    }

    // Create appointment
    const appointment = new Appointment({
      client: client._id,
      services,
      date: new Date(date),
      time,
      status: 'pending',
      notes,
      totalAmount: calculateTotal(services)
    });

    await appointment.save();

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: await appointment.populate('client')
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Failed to create appointment' });
  }
});

// Get all appointments (requires auth)
router.get('/', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('client')
      .sort({ date: 1, time: 1 });
    
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

// Get appointment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('client');
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
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, notes, updatedAt: new Date() },
      { new: true }
    ).populate('client');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Failed to update appointment' });
  }
});

// Delete appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Failed to delete appointment' });
  }
});

// Helper function to calculate total cost
function calculateTotal(services: string[]): number {
  const servicePrices: { [key: string]: number } = {
    'full-groom': 65,
    'bath-brush': 45,
    'nail-trim': 25,
    'teeth-cleaning': 35,
    'flea-treatment': 40
  };

  return services.reduce((total, serviceId) => {
    return total + (servicePrices[serviceId] || 0);
  }, 0);
}

export default router;