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

// Groomer (User) associations
User.hasMany(Appointment, {
  foreignKey: 'groomerId',
  as: 'assignments'
});

Appointment.belongsTo(User, {
  foreignKey: 'groomerId',
  as: 'groomer'
});

// Export models for easier importing
export {
  Client,
  Appointment,
  User
};
