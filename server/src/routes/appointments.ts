import express from 'express';
import { Appointment, Client, User } from '../models/index';
import { AdditionalService } from '../models/AdditionalServiceMySQL';
import { auth } from '../middleware/authMySQL';
import { Op } from 'sequelize';

const router = express.Router();

// Search clients for appointment creation (admin only)
router.get('/search-clients', auth, async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.json([]);
    }

    const clients = await Client.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
          { phone: { [Op.like]: `%${query}%` } }
        ]
      },
      limit: 10,
      order: [['name', 'ASC']]
    });

    res.json(clients);
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ error: 'Failed to search clients' });
  }
});

// Create new client (admin only)
router.post('/create-client', auth, async (req, res) => {
  try {
    const { name, email, phone, address, pets } = req.body;

    // Check if client already exists
    const existingClient = await Client.findOne({ where: { email } });
    if (existingClient) {
      return res.status(400).json({ error: 'Client with this email already exists' });
    }

    const newClient = await Client.create({
      name,
      email,
      phone,
      address,
      pets: pets || [],
      notes: ''
    });

    res.status(201).json(newClient);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client (admin only)
router.put('/update-client/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, pets } = req.body;

    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await client.update({
      name,
      email,
      phone,
      address,
      pets: pets || []
    });

    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

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
      totalAmount: await calculateTotal(services)
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
  if (services !== undefined) updateData.totalAmount = await calculateTotal(services);

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
async function calculateTotal(services: any[]): Promise<number> {
  // Look up additional services from DB when possible
  if (!Array.isArray(services)) return 0;
  let total = 0;
  for (const srv of services) {
    const id = typeof srv === 'string' ? srv : srv.id || srv.code || srv.name;
    // Special case: full-groom-by-breed can pass an object like { id:'full-groom', breedPrice: 95 }
    if (typeof srv === 'object' && srv.id === 'full-groom' && typeof srv.breedPrice === 'number') {
      total += srv.breedPrice;
      continue;
    }
    const found = await AdditionalService.findOne({ where: { code: id } });
    if (found) total += Number(found.price);
  }
  return total;
}

export default router;