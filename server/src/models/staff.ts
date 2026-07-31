import { Schema, model } from "mongoose";

export interface StaffDocument {
  _id: string;
  name: string;
  colour: string;
  displayOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const staffSchema = new Schema<StaffDocument>(
  {
    name: { type: String, required: true, trim: true },
    colour: { type: String, required: true, default: "#0f766e" },
    displayOrder: { type: Number, required: true, default: 0 },
    active: { type: Boolean, required: true, default: true }
  },
  { timestamps: true }
);

staffSchema.index({ displayOrder: 1, name: 1 });

export const Staff = model<StaffDocument>("Staff", staffSchema);
