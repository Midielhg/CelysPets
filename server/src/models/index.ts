import { Client } from './ClientMySQL';
import { Appointment } from './AppointmentMySQL';
import { User } from './UserMySQL';
import { Breed } from './BreedMySQL';
import { AdditionalService } from './AdditionalServiceMySQL';
import Pet from './PetMySQL';

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

// Pet associations
User.hasMany(Pet, {
  foreignKey: 'ownerId',
  as: 'pets'
});

Pet.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});

// Export models for easier importing
export {
  Client,
  Appointment,
  User,
  Breed,
  AdditionalService,
  Pet
};
