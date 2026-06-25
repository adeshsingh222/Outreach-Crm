import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  type: string;
  description?: string;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ActivitySchema: Schema = new Schema({
  type: { type: String, required: true },
  description: { type: String },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const Activity = (mongoose.models.Activity as mongoose.Model<IActivity>) || mongoose.model<IActivity>('Activity', ActivitySchema);
