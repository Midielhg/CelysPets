"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Appointment = exports.Client = void 0;
const ClientMySQL_1 = require("./ClientMySQL");
Object.defineProperty(exports, "Client", { enumerable: true, get: function () { return ClientMySQL_1.Client; } });
const AppointmentMySQL_1 = require("./AppointmentMySQL");
Object.defineProperty(exports, "Appointment", { enumerable: true, get: function () { return AppointmentMySQL_1.Appointment; } });
const UserMySQL_1 = require("./UserMySQL");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return UserMySQL_1.User; } });
// Set up associations
ClientMySQL_1.Client.hasMany(AppointmentMySQL_1.Appointment, {
    foreignKey: 'clientId',
    as: 'appointments'
});
AppointmentMySQL_1.Appointment.belongsTo(ClientMySQL_1.Client, {
    foreignKey: 'clientId',
    as: 'client'
});
//# sourceMappingURL=index.js.map