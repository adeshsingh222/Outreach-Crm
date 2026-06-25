import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  content: string;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema({
  content: { type: String, required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const Note = (mongoose.models.Note as mongoose.Model<INote>) || mongoose.model<INote>('Note', NoteSchema);
