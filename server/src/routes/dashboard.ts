import express from 'express';
import { Op } from 'sequelize';
import { auth } from '../middleware/authMySQL';
import { Appointment } from '../models/AppointmentMySQL';
import { Client } from '../models/ClientMySQL';

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
  try {
    const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const totalAppointments = await Appointment.count({
      where: { date: { [Op.gte]: startOfMonth, [Op.lt]: startOfNextMonth } }
    });

    const revenueRows = await Appointment.findAll({
      where: { date: { [Op.gte]: startOfMonth, [Op.lt]: startOfNextMonth } },
      attributes: ['totalAmount']
    });
    const totalRevenue = revenueRows.reduce((sum: number, a: any) => {
      const val = a?.get ? a.get('totalAmount') : (a.totalAmount as any);
      const num = val == null ? 0 : Number.parseFloat(String(val));
      return sum + (Number.isFinite(num) ? num : 0);
    }, 0);

    const totalClients = await Client.count();

    const averageRating = 4.8;

  res.json({ appointmentsThisMonth: totalAppointments, totalRevenue, totalClients, averageRating });
  } catch (err) {
    console.error('Dashboard /stats error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

export default router;
