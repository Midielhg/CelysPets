"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
// Client model class
class Client extends sequelize_1.Model {
}
exports.Client = Client;
// Initialize Client model
Client.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
    },
    address: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    pets: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_1.default,
    modelName: 'Client',
    tableName: 'clients',
    timestamps: true,
});
//# sourceMappingURL=ClientMySQL.js.map