import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  name: string;
  fileUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema: Schema = new Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const Resume = mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
