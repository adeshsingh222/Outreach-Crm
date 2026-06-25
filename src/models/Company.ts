import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  website?: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  category?: string;
  email?: string;
  lat?: number;
  lng?: number;

  hrName?: string;
  linkedin?: string;
  city?: string;
  employeeCount?: string;
  revenue?: string;
  lastContactDate?: Date;
  nextFollowUp?: Date;
  placeId?: string;

  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  
  tagIds: mongoose.Types.ObjectId[];
}

const CompanySchema: Schema = new Schema({
  name: { type: String, required: true },
  website: { type: String },
  phone: { type: String },
  address: { type: String },
  rating: { type: Number },
  reviews: { type: Number },
  category: { type: String },
  email: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  placeId: { type: String },

  hrName: { type: String },
  linkedin: { type: String },
  city: { type: String },
  employeeCount: { type: String },
  revenue: { type: String },
  lastContactDate: { type: Date },
  nextFollowUp: { type: Date },

  status: { type: String, default: 'Not Contacted' },
  priority: { type: String, default: 'Medium' },
  
  tagIds: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const Company = (mongoose.models.Company as mongoose.Model<ICompany>) || mongoose.model<ICompany>('Company', CompanySchema);
