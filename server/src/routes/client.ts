import express from 'express';
import { auth } from '../middleware/authMySQL';
import { User } from '../models/UserMySQL';
import { Client } from '../models/ClientMySQL';
import { Appointment } from '../models/AppointmentMySQL';
import Pet from '../models/PetMySQL';

interface AuthRequest extends express.Request {
  user?: any;
}

const router = express.Router();

// Apply auth middleware to all client routes
router.use(auth);

// Get client's pets
router.get('/pets', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pets = await Pet.findAll({ 
      where: { ownerId: userId },
      order: [['createdAt', 'DESC']]
    });

    res.json(pets);
  } catch (error) {
    console.error('Error fetching pets:', error);
    res.status(500).json({ error: 'Failed to fetch pets' });
  }
});

// Get specific pet details
router.get('/pets/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const petId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pet = await Pet.findOne({ 
      where: { 
        id: petId,
        ownerId: userId 
      }
    });
    
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(pet);
  } catch (error) {
    console.error('Error fetching pet details:', error);
    res.status(500).json({ error: 'Failed to fetch pet details' });
  }
});

// Add a new pet
router.post('/pets', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, breed, age, weight, species, notes } = req.body;

    const newPet = await Pet.create({
      ownerId: userId,
      name,
      breed,
      age: parseInt(age),
      weight: parseInt(weight),
      species,
      notes: notes || ''
    });

    res.status(201).json(newPet);
  } catch (error) {
    console.error('Error adding pet:', error);
    res.status(500).json({ error: 'Failed to add pet' });
  }
});

// Update a pet
router.put('/pets/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const petId = req.params.id;
    const { name, breed, age, weight, species, notes } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pet = await Pet.findOne({ 
      where: { 
        id: petId,
        ownerId: userId 
      }
    });

    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    await pet.update({
      name,
      breed,
      age: parseInt(age),
      weight: parseInt(weight),
      species,
      notes: notes || ''
    });

    res.json(pet);
  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({ error: 'Failed to update pet' });
  }
});

// Get client's appointments
router.get('/appointments', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the user details to find their email
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the client record by email to get clientId
    const client = await Client.findOne({ 
      where: { email: user.email } 
    });

    if (!client) {
      // If no client record exists, return empty appointments
      return res.json([]);
    }

    // Fetch real appointments for this client from the database
    const appointments = await Appointment.findAll({
      where: { clientId: client.id },
      include: [
        {
          model: User,
          as: 'groomer',
          attributes: ['name'],
          required: false
        }
      ],
      order: [['date', 'DESC'], ['time', 'ASC']]
    });

    // Transform the data to match the frontend interface
    const transformedAppointments = appointments.map((appointment: any) => {
      // Service name mapping
      const serviceNames: { [key: string]: string } = {
        'full-groom': 'Full Service Grooming',
        'bath-brush': 'Bath & Brush',
        'nail-trim': 'Nail Trim',
        'teeth-cleaning': 'Teeth Cleaning',
        'flea-treatment': 'Flea Treatment'
      };

      // Better service handling
      let serviceText = '';
      if (Array.isArray(appointment.services)) {
        // Handle array of service objects like [{ id: 'full-groom', breedPrice: 200 }]
        serviceText = appointment.services.map((service: any) => {
          if (typeof service === 'string') {
            return serviceNames[service] || service;
          } else if (service && typeof service === 'object' && service.id) {
            return serviceNames[service.id] || service.id;
          } else if (service && typeof service === 'object' && service.name) {
            return service.name;
          }
          return 'Unknown Service';
        }).join(', ');
      } else if (typeof appointment.services === 'string') {
        serviceText = serviceNames[appointment.services] || appointment.services;
      } else if (appointment.services && typeof appointment.services === 'object') {
        // If it's a single object, try to extract meaningful text
        if (appointment.services.id) {
          serviceText = serviceNames[appointment.services.id] || appointment.services.id;
        } else if (appointment.services.name) {
          serviceText = appointment.services.name;
        } else if (appointment.services.type) {
          serviceText = appointment.services.type;
        } else {
          serviceText = 'Service Details Available';
        }
      } else {
        serviceText = 'Service Not Specified';
      }

      // Get pet name(s) from client's pets data
      let petName = 'Your Pet'; // Default fallback
      if (client.pets && Array.isArray(client.pets) && client.pets.length > 0) {
        if (client.pets.length === 1) {
          // Single pet
          petName = client.pets[0].name || 'Your Pet';
        } else {
          // Multiple pets - show all names
          const petNames = client.pets.map(pet => pet.name).filter(name => name);
          if (petNames.length > 0) {
            petName = petNames.join(' & ');
          }
        }
      }

      return {
        id: appointment.id.toString(),
        date: appointment.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        time: appointment.time,
        service: serviceText,
        petName: petName,
        petId: client.pets && Array.isArray(client.pets) && client.pets.length > 0 ? '1' : '1', // Placeholder
        status: appointment.status,
        groomerName: appointment.groomer?.name || 'Not assigned',
        address: client.address || '',
        price: appointment.totalAmount ? parseFloat(appointment.totalAmount.toString()) : 0,
        notes: appointment.notes || ''
      };
    });

    res.json(transformedAppointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get client profile
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from database
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Try to get client profile data
    const client = await Client.findOne({ where: { email: user.email } });

    // Parse address if client exists and has address
    let addressParts = {
      address: '',
      city: '',
      state: '',
      zipCode: ''
    };

    if (client && client.address) {
      // Try to parse the full address string
      const addressParts_temp = client.address.split(', ');
      if (addressParts_temp.length >= 3) {
        addressParts.address = addressParts_temp[0] || '';
        addressParts.city = addressParts_temp[1] || '';
        const stateZip = addressParts_temp[2] || '';
        const stateZipParts = stateZip.split(' ');
        addressParts.state = stateZipParts[0] || '';
        addressParts.zipCode = stateZipParts[1] || '';
      } else {
        addressParts.address = client.address;
      }
    }

    // Return user profile data
    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: client?.phone || '',
      address: addressParts.address,
      city: addressParts.city,
      state: addressParts.state,
      zipCode: addressParts.zipCode
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update client profile
router.put('/profile', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, email, phone, address, city, state, zipCode } = req.body;

    // Update user in database
    await User.update(
      { name, email },
      { where: { id: userId } }
    );

    // Also update or create client record
    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
    
    // Find existing client record by email
    let client = await Client.findOne({ where: { email: email } });
    
    if (client) {
      // Update existing client
      await client.update({
        name,
        email,
        phone,
        address: fullAddress
      });
    } else {
      // Create new client record if it doesn't exist
      client = await Client.create({
        name,
        email,
        phone,
        address: fullAddress,
        pets: [],
        notes: ''
      });
    }

    // Return updated profile
    const profile = {
      id: userId,
      name,
      email,
      phone,
      address,
      city,
      state,
      zipCode
    };

    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get client dashboard stats
router.get('/dashboard-stats', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get real pet count
    const totalPets = await Pet.count({ where: { ownerId: userId } });

    // For appointments, we'll use mock data for now since appointments are still mock
    const stats = {
      totalPets,
      totalAppointments: 8, // Mock until appointment system is connected to real data
      upcomingAppointments: 1 // Mock until appointment system is connected to real data
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
