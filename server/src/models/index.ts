import { Client } from './ClientMySQL';
import { Appointment } from './AppointmentMySQL';
import { User } from './UserMySQL';

// Set up associations
Client.hasMany(Appointment, {
  foreignKey: 'clientId',
  as: 'appointments'
});

Appointment.belongsTo(Client, {
  foreignKey: 'clientId',
  as: 'client'
});

// Export models for easier importing
export {
  Client,
  Appointment,
  User
};
