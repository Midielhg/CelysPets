import { Client } from './ClientMySQL';
import { Appointment } from './AppointmentMySQL';
import { User } from './UserMySQL';
import { Breed } from './BreedMySQL';
import { AdditionalService } from './AdditionalServiceMySQL';
import { PromoCode } from './PromoCodeMySQL';
import { PromoCodeUsage } from './PromoCodeUsageMySQL';
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

// Promo Code associations
PromoCode.hasMany(PromoCodeUsage, {
  foreignKey: 'promoCodeId',
  as: 'usages'
});

PromoCodeUsage.belongsTo(PromoCode, {
  foreignKey: 'promoCodeId',
  as: 'promoCode'
});

// Appointment and PromoCode association
PromoCode.hasMany(Appointment, {
  foreignKey: 'promoCodeId',
  as: 'appointments'
});

Appointment.belongsTo(PromoCode, {
  foreignKey: 'promoCodeId',
  as: 'promoCode'
});

// Appointment and PromoCodeUsage association
Appointment.hasMany(PromoCodeUsage, {
  foreignKey: 'appointmentId',
  as: 'promoCodeUsages'
});

PromoCodeUsage.belongsTo(Appointment, {
  foreignKey: 'appointmentId',
  as: 'appointment'
});

// Export models for easier importing
export {
  Client,
  Appointment,
  User,
  Breed,
  AdditionalService,
  PromoCode,
  PromoCodeUsage,
  Pet
};
