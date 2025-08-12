import express from 'express';
import { Appointment, Client, User } from '../models/index';
import { auth } from '../middleware/authMySQL';

const router = express.Router();

// Create appointment (public endpoint for booking)
router.post('/', async (req, res) => {
  try {
    const { client: clientData, services, date, time, notes, groomerId } = req.body;

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
      groomerId: groomerId || null,
      services: services,
      date: new Date(date),
      time: time,
      status: 'pending',
      notes: notes || null,
      totalAmount: calculateTotal(services)
    });

    // Fetch the created appointment with client data
    const createdAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Client, as: 'client' },
        {
          model: User,
          as: 'groomer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
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

// Get all appointments (no auth required for now - can add later)
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    console.log('Fetching appointments with query:', { date });
    
    let whereClause = {};
    
    // If date filter is provided, filter by date
    if (date) {
      const targetDate = new Date(date as string);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);
      
      whereClause = {
        date: {
          [require('sequelize').Op.gte]: targetDate,
          [require('sequelize').Op.lt]: nextDay
        }
      };
      console.log('Filtering by date range:', { from: targetDate, to: nextDay });
    }
    
    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { 
          model: Client, 
          as: 'client' 
        },
        {
          model: User,
          as: 'groomer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [['date', 'ASC'], ['time', 'ASC']]
    });
    
    console.log(`Found ${appointments.length} appointments`);
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

// Get appointments for a specific groomer (must come before /:id route)
router.get('/groomer/:groomerId', auth, async (req, res) => {
  try {
    const { groomerId } = req.params;
    const { date } = req.query;

    let whereClause: any = { groomerId };

    // Filter by date if provided
    if (date) {
      const targetDate = new Date(date as string);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereClause.date = {
        [require('sequelize').Op.gte]: targetDate,
        [require('sequelize').Op.lt]: nextDay
      };
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { 
          model: Client, 
          as: 'client' 
        },
        {
          model: User,
          as: 'groomer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [['date', 'ASC'], ['time', 'ASC']]
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching groomer appointments:', error);
    res.status(500).json({ message: 'Failed to fetch groomer appointments' });
  }
});

// Get my appointments (for authenticated groomers) - must come before /:id route
router.get('/my-appointments', auth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== 'groomer' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Only groomers can access this endpoint' });
    }

    const { date } = req.query;
    let whereClause: any = { groomerId: user.id };

    // Filter by date if provided
    if (date) {
      const targetDate = new Date(date as string);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereClause.date = {
        [require('sequelize').Op.gte]: targetDate,
        [require('sequelize').Op.lt]: nextDay
      };
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { 
          model: Client, 
          as: 'client' 
        },
        {
          model: User,
          as: 'groomer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [['date', 'ASC'], ['time', 'ASC']]
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching my appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

// Recent activity - last 10 appointments by update time
router.get('/recent', async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        { model: Client, as: 'client' },
        {
          model: User,
          as: 'groomer',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
      order: [['updatedAt', 'DESC']],
      limit: 10,
    });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching recent appointments:', error);
    res.status(500).json({ message: 'Failed to fetch recent activity' });
  }
});

// Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        {
          model: User,
          as: 'groomer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
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
router.patch('/:id', async (req, res) => {
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
      include: [
        { model: Client, as: 'client' },
        {
          model: User,
          as: 'groomer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Failed to update appointment' });
  }
});

// Full appointment update (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { client: clientData, services, date, time, status, notes, groomerId } = req.body;
    
    console.log('Updating appointment with data:', { clientData, services, date, time, status });

    const appointment = await Appointment.findByPk(req.params.id, {
      include: [{ model: Client, as: 'client' }]
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Update client information if provided
    if (clientData && (appointment as any).client) {
      await (appointment as any).client.update({
        name: clientData.name || (appointment as any).client.name,
        email: clientData.email || (appointment as any).client.email,
        phone: clientData.phone || (appointment as any).client.phone,
        address: clientData.address || (appointment as any).client.address,
        pets: clientData.pets || (appointment as any).client.pets,
        notes: clientData.notes !== undefined ? clientData.notes : (appointment as any).client.notes
      });
    }

    // Update appointment details
    const updateData: any = {};
    if (services !== undefined) updateData.services = services;
    if (date !== undefined) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (groomerId !== undefined) updateData.groomerId = groomerId;
    if (services !== undefined) updateData.totalAmount = calculateTotal(services);

    await appointment.update(updateData);

    // Fetch updated appointment with client data
    const updatedAppointment = await Appointment.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        {
          model: User,
          as: 'groomer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    res.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating full appointment:', error);
    res.status(500).json({ message: 'Failed to update appointment' });
  }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
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