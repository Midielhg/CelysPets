import mongoose, { Document } from 'mongoose';
export interface IPet {
    name: string;
    type: 'dog' | 'cat';
    breed: string;
    weight?: string;
    specialInstructions?: string;
}
export interface IClient extends Document {
    name: string;
    email: string;
    phone: string;
    address: string;
    pets: IPet[];
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Client: mongoose.Model<IClient, {}, {}, {}, mongoose.Document<unknown, {}, IClient, {}> & IClient & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Client.d.ts.map