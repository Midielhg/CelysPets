import express from 'express';
import { auth } from '../middleware/authMySQL';
import { Client } from '../models/ClientMySQL';
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/clients - Get all clients with pagination and search
router.get('/', auth, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = {};
    
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
          { address: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows: clients } = await Client.findAndCountAll({
      where: whereClause,
      order: [['name', 'ASC']],
      limit: Number(limit),
      offset: offset
    });

    const totalPages = Math.ceil(count / Number(limit));

    res.json({
      clients,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/clients/:id - Get specific client
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// POST /api/clients - Create new client
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, address, pets = [], notes } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !address) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, phone, address' 
      });
    }

    // Check if email already exists
    const existingClient = await Client.findOne({ where: { email } });
    if (existingClient) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const client = await Client.create({
      name,
      email,
      phone,
      address,
      pets,
      notes
    });

    res.json({ 
      message: 'Client created successfully', 
      client 
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id - Update existing client
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, pets, notes } = req.body;

    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if email is being changed and if new email already exists
    if (email && email !== client.email) {
      const existingClient = await Client.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: id }
        } 
      });
      if (existingClient) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    // Update only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (pets !== undefined) updateData.pets = pets;
    if (notes !== undefined) updateData.notes = notes;

    await client.update(updateData);

    res.json({ 
      message: 'Client updated successfully', 
      client 
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if client has appointments (assuming you have an Appointment model)
    // You may need to import and use the Appointment model
    // const appointmentCount = await Appointment.count({ where: { clientId: id } });
    // if (appointmentCount > 0) {
    //   return res.status(409).json({ error: 'Cannot delete client with existing appointments' });
    // }

    await client.destroy();

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;
