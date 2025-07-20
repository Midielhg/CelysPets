"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Appointment_1 = require("../models/Appointment");
const Client_1 = require("../models/Client");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Create appointment (public endpoint for booking)
router.post('/', async (req, res) => {
    try {
        const { client: clientData, services, date, time, notes } = req.body;
        // Create or find client
        let client = await Client_1.Client.findOne({ email: clientData.email });
        if (!client) {
            client = new Client_1.Client(clientData);
            await client.save();
        }
        else {
            // Update client information
            Object.assign(client, clientData);
            await client.save();
        }
        // Create appointment
        const appointment = new Appointment_1.Appointment({
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
    }
    catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ message: 'Failed to create appointment' });
    }
});
// Get all appointments (requires auth)
router.get('/', auth_1.auth, async (req, res) => {
    try {
        const appointments = await Appointment_1.Appointment.find()
            .populate('client')
            .sort({ date: 1, time: 1 });
        res.json(appointments);
    }
    catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Failed to fetch appointments' });
    }
});
// Get appointment by ID
router.get('/:id', auth_1.auth, async (req, res) => {
    try {
        const appointment = await Appointment_1.Appointment.findById(req.params.id).populate('client');
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        res.json(appointment);
    }
    catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({ message: 'Failed to fetch appointment' });
    }
});
// Update appointment status
router.patch('/:id', auth_1.auth, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const appointment = await Appointment_1.Appointment.findByIdAndUpdate(req.params.id, { status, notes, updatedAt: new Date() }, { new: true }).populate('client');
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        res.json(appointment);
    }
    catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ message: 'Failed to update appointment' });
    }
});
// Delete appointment
router.delete('/:id', auth_1.auth, async (req, res) => {
    try {
        const appointment = await Appointment_1.Appointment.findByIdAndDelete(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        res.json({ message: 'Appointment deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ message: 'Failed to delete appointment' });
    }
});
// Helper function to calculate total cost
function calculateTotal(services) {
    const servicePrices = {
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
exports.default = router;
//# sourceMappingURL=appointments-old.js.map