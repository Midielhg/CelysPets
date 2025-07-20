"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Appointment = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
// Appointment model class
class Appointment extends sequelize_1.Model {
}
exports.Appointment = Appointment;
// Initialize Appointment model
Appointment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    clientId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'clients',
            key: 'id',
        },
    },
    services: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
    },
    date: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    time: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'confirmed', 'in-progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    totalAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'Appointment',
    tableName: 'appointments',
    timestamps: true,
});
//# sourceMappingURL=AppointmentMySQL.js.map