import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['PDF', 'Portfolio', 'GitHub', 'LinkedIn', 'Other'],
    default: 'Other'
  },
  description: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret: Record<string, any>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export interface IAsset extends mongoose.Document {
  title: string;
  url: string;
  type: 'PDF' | 'Portfolio' | 'GitHub' | 'LinkedIn' | 'Other';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const Asset = (mongoose.models.Asset as mongoose.Model<IAsset>) || mongoose.model<IAsset>('Asset', assetSchema);
