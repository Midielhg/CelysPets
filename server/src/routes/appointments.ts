import express from 'express';
import { Appointment, Client, User } from '../models/index';
import { AdditionalService } from '../models/AdditionalServiceMySQL';
import { Breed } from '../models/BreedMySQL';
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

    // Calculate duration and end time
    const duration = await calculateDuration(services, clientData.pets);
    const endTime = calculateEndTime(time, duration);

    // Create appointment
    const appointment = await Appointment.create({
      clientId: client.id,
      groomerId: groomerId || null,
      services: services,
      date: new Date(date),
      time: time,
      endTime: endTime,
      duration: duration,
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
    
    // Format the appointments data to ensure proper date formatting
    const formattedAppointments = appointments.map(appointment => {
      const appointmentData = appointment.toJSON() as any;
      
      // Format the date to YYYY-MM-DD format instead of full timestamp
      if (appointmentData.date) {
        const date = new Date(appointmentData.date);
        appointmentData.date = date.toISOString().split('T')[0]; // Extract just the date part
      }
      
      return appointmentData;
    });
    
    res.json(formattedAppointments);
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
    const { 
      clientName, 
      clientEmail, 
      clientPhone, 
      clientAddress, 
      pets, 
      services, 
      date, 
      time, 
      status, 
      notes, 
      groomerId 
    } = req.body;
    
    console.log('Updating appointment with data:', { 
      clientName, clientEmail, clientPhone, clientAddress, pets, services, date, time, status 
    });

    const appointment = await Appointment.findByPk(req.params.id, {
      include: [{ model: Client, as: 'client' }]
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Update client information if provided
    if ((appointment as any).client) {
      await (appointment as any).client.update({
        name: clientName || (appointment as any).client.name,
        email: clientEmail || (appointment as any).client.email,
        phone: clientPhone || (appointment as any).client.phone,
        address: clientAddress || (appointment as any).client.address,
        pets: pets || (appointment as any).client.pets,
      });
    }

    // Calculate duration and end time for updated appointment
    let totalDuration = 0;
    let endTime = time;

    if (pets && pets.length > 0 && services && services.length > 0) {
      totalDuration = await calculateDuration(pets, services);
      endTime = calculateEndTime(time, totalDuration);
    }

    // Update appointment details
    const updateData: any = {};
    if (services !== undefined) updateData.services = services;
    if (date !== undefined) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (groomerId !== undefined) updateData.groomerId = groomerId;
    if (totalDuration > 0) {
      updateData.duration = totalDuration;
      updateData.endTime = endTime;
    }
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

    // Return the appointment in the format expected by frontend
    res.json(updatedAppointment);
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

// Route optimization endpoint
router.post('/optimize-route', auth, async (req, res) => {
  try {
    const { date, appointments: appointmentIds } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Get appointments for the specified date
    let appointmentsToOptimize;
    
    if (appointmentIds && appointmentIds.length > 0) {
      // Use specific appointment IDs if provided
      appointmentsToOptimize = await Appointment.findAll({
        where: {
          id: { [Op.in]: appointmentIds }
        },
        include: [{
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'address', 'phone', 'email']
        }],
        order: [['time', 'ASC']]
      });
    } else {
      // Get all appointments for the date
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      appointmentsToOptimize = await Appointment.findAll({
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          },
          status: { [Op.ne]: 'cancelled' }
        },
        include: [{
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'address', 'phone', 'email']
        }],
        order: [['time', 'ASC']]
      });
      
      // Debug logging for August 13th
      if (date.includes('2025-08-13')) {
        console.log('DEBUG: Route optimization for Aug 13, 2025');
        console.log('Start date:', startDate);
        console.log('End date:', endDate);
        console.log('Found appointments:', appointmentsToOptimize.length);
        appointmentsToOptimize.forEach((apt, index) => {
          console.log(`Appointment ${index + 1}:`, {
            id: apt.id,
            date: apt.date,
            time: apt.time,
            clientId: apt.clientId,
            status: apt.status
          });
        });
      }
    }

    if (appointmentsToOptimize.length < 2) {
      return res.json({
        optimizedRoute: appointmentsToOptimize,
        totalDistance: 0,
        estimatedTime: 0,
        message: 'Need at least 2 appointments to optimize route'
      });
    }

    // Basic route optimization (sort by time for now)
    // TODO: Implement actual geographic optimization using Google Maps API
    const optimizedRoute = [...appointmentsToOptimize].sort((a, b) => {
      const timeA = a.time || '09:00';
      const timeB = b.time || '09:00';
      return timeA.localeCompare(timeB);
    });

    // Mock distance and time calculations
    // TODO: Replace with actual Google Maps Distance Matrix API
    const totalDistance = appointmentsToOptimize.length > 1 
      ? Math.random() * 50 + 10 // Mock: 10-60 miles for multiple appointments
      : 0;
    const estimatedTime = appointmentsToOptimize.length > 1 
      ? appointmentsToOptimize.length * 15 + Math.random() * 60 // Mock: 15 min per stop + travel
      : 0;

    res.json({
      optimizedRoute,
      totalDistance: Math.round(totalDistance * 10) / 10,
      estimatedTime: Math.round(estimatedTime),
      message: 'Route optimized successfully',
      geocodingReady: true
    });

  } catch (error) {
    console.error('Error optimizing route:', error);
    res.status(500).json({ error: 'Failed to optimize route' });
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

// Helper function to calculate total duration
async function calculateDuration(services: any[], pets: any[] = []): Promise<number> {
  if (!Array.isArray(services)) return 60; // Default 1 hour
  
  let totalDuration = 0;
  let hasFullGrooming = false;
  
  for (const srv of services) {
    const id = typeof srv === 'string' ? srv : srv.id || srv.code || srv.name;
    
    // Handle full grooming service
    if (id === 'full-groom' || id === 'Full Service') {
      hasFullGrooming = true;
      // Calculate duration based on breeds if pets are provided
      if (pets && pets.length > 0) {
        for (const pet of pets) {
          if (pet.breedId) {
            // Look up breed duration
            const breed = await Breed.findByPk(pet.breedId);
            if (breed && breed.fullGroomDuration) {
              totalDuration += breed.fullGroomDuration;
            } else {
              totalDuration += 90; // Default full groom duration
            }
          } else {
            totalDuration += 90; // Default if no breed specified
          }
        }
      } else {
        totalDuration += 90; // Default for full groom without pet info
      }
    } else {
      // Handle additional services
      const found = await AdditionalService.findOne({ where: { code: id } });
      if (found && found.duration) {
        // For additional services, multiply by number of pets if applicable
        const multiplier = hasFullGrooming ? 1 : (pets?.length || 1);
        totalDuration += found.duration * multiplier;
      } else {
        totalDuration += 30; // Default additional service duration
      }
    }
  }
  
  return Math.max(totalDuration, 30); // Minimum 30 minutes
}

// Helper function to calculate end time
function calculateEndTime(startTime: string, durationMinutes: number): string {
  // Parse start time
  const [time, period] = startTime.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  // Convert to 24-hour format
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) hour24 += 12;
  if (period === 'AM' && hours === 12) hour24 = 0;
  
  // Calculate end time in minutes from midnight
  const startMinutes = hour24 * 60 + minutes;
  const endMinutes = startMinutes + durationMinutes;
  
  // Convert back to 12-hour format
  const endHour24 = Math.floor(endMinutes / 60) % 24;
  const endMin = endMinutes % 60;
  
  let endHour12 = endHour24;
  let endPeriod = 'AM';
  
  if (endHour24 === 0) {
    endHour12 = 12;
  } else if (endHour24 === 12) {
    endPeriod = 'PM';
  } else if (endHour24 > 12) {
    endHour12 = endHour24 - 12;
    endPeriod = 'PM';
  }
  
  return `${endHour12}:${endMin.toString().padStart(2, '0')} ${endPeriod}`;
}

export default router;