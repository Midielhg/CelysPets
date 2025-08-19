import express from 'express';
import { Op } from 'sequelize';
import { auth } from '../middleware/authMySQL';
import { Appointment } from '../models/AppointmentMySQL';
import { Client } from '../models/ClientMySQL';
import { AdditionalService } from '../models/AdditionalServiceMySQL';

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Count appointments for this month
    const totalAppointments = await Appointment.count({
      where: { 
        date: { [Op.gte]: startOfMonth, [Op.lt]: startOfNextMonth },
        status: { [Op.ne]: 'cancelled' } // Exclude cancelled appointments
      }
    });

    // Calculate total revenue for this month
    const appointmentsWithRevenue = await Appointment.findAll({
      where: { 
        date: { [Op.gte]: startOfMonth, [Op.lt]: startOfNextMonth },
        status: { [Op.in]: ['completed', 'confirmed', 'in-progress'] } // Only count confirmed/completed appointments
      },
      attributes: ['id', 'totalAmount', 'services'],
      raw: true
    });

    let totalRevenue = 0;
    for (const appointment of appointmentsWithRevenue) {
      if (appointment.totalAmount && appointment.totalAmount > 0) {
        totalRevenue += Number(appointment.totalAmount);
      } else if (appointment.services && Array.isArray(appointment.services)) {
        // Fallback: calculate revenue based on services if totalAmount is not set
        const fallbackTotal = await calculateAppointmentTotal(appointment.services);
        totalRevenue += fallbackTotal;
      } else {
        // Last resort fallback for appointments without proper service data
        totalRevenue += 50; // $50 default
      }
    }

    const totalClients = await Client.count();

    // TODO: Implement real rating calculation from reviews/feedback
    const averageRating = 4.8;

    console.log(`Dashboard stats - Appointments: ${totalAppointments}, Revenue: $${totalRevenue}, Clients: ${totalClients}`);

    res.json({ 
      appointmentsThisMonth: totalAppointments, 
      totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
      totalClients, 
      averageRating 
    });
  } catch (err) {
    console.error('Dashboard /stats error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// Helper function to calculate appointment total from services
async function calculateAppointmentTotal(services: any[]): Promise<number> {
  if (!Array.isArray(services)) return 0;
  let total = 0;
  
  for (const srv of services) {
    const serviceCode = typeof srv === 'string' ? srv : srv.id || srv.code || srv.name;
    
    // Special case: full-groom services with breed price
    if (typeof srv === 'object' && srv.id === 'full-groom' && typeof srv.breedPrice === 'number') {
      total += srv.breedPrice;
      continue;
    }
    
    // Look up service in additional services table
    try {
      const found = await AdditionalService.findOne({ where: { code: serviceCode } });
      if (found) {
        total += Number(found.price);
      } else {
        // Fallback for unknown services
        total += 25; // $25 default per unknown service
      }
    } catch (error) {
      console.error('Error looking up service:', serviceCode, error);
      total += 25; // Fallback amount
    }
  }
  
  return total;
}

export default router;
