import mongoose, { Document } from 'mongoose';
export interface IBusinessSettings {
    businessName: string;
    serviceArea: string[];
    timeSlots: string[];
}
export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    role: 'client' | 'admin';
    businessSettings?: IBusinessSettings;
    googleTokens?: {
        accessToken?: string;
        refreshToken?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map