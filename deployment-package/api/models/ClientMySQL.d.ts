import { Model, Optional } from 'sequelize';
interface IPet {
    name: string;
    type: 'dog' | 'cat';
    breed: string;
    weight?: string;
    specialInstructions?: string;
}
interface ClientAttributes {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    pets: IPet[];
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface ClientCreationAttributes extends Optional<ClientAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    pets: IPet[];
    notes?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { Client };
export interface IClient extends ClientAttributes {
}
export type { IPet };
//# sourceMappingURL=ClientMySQL.d.ts.map