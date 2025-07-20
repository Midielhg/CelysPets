import { Model, Optional } from 'sequelize';
interface BusinessSettings {
    businessName: string;
    serviceArea: string[];
    timeSlots: string[];
}
interface UserAttributes {
    id: number;
    email: string;
    password: string;
    name: string;
    role: 'client' | 'admin';
    businessSettings?: BusinessSettings;
    googleTokens?: {
        accessToken?: string;
        refreshToken?: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: number;
    email: string;
    password: string;
    name: string;
    role: 'client' | 'admin';
    businessSettings?: BusinessSettings;
    googleTokens?: {
        accessToken?: string;
        refreshToken?: string;
    };
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { User };
export interface IUser extends UserAttributes {
}
export interface IBusinessSettings extends BusinessSettings {
}
//# sourceMappingURL=UserMySQL.d.ts.map