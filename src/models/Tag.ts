import mongoose, { Schema, Document } from 'mongoose';

export interface ITag extends Document {
  name: string;
  color?: string;
  companyIds: mongoose.Types.ObjectId[];
}

const TagSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  color: { type: String },
  companyIds: [{ type: Schema.Types.ObjectId, ref: 'Company' }],
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const Tag = mongoose.models.Tag || mongoose.model<ITag>('Tag', TagSchema);
