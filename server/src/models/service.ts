import { Schema, model } from "mongoose";

export interface ServiceDocument {
  _id: string;
  name: string;
  defaultDuration: number;
  colour: string;
  displayOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<ServiceDocument>(
  {
    name: { type: String, required: true, trim: true },
    defaultDuration: { type: Number, required: true, min: 15, max: 240 },
    colour: { type: String, required: true, default: "#ccfbf1" },
    displayOrder: { type: Number, required: true, default: 0 },
    active: { type: Boolean, required: true, default: true }
  },
  { timestamps: true }
);

serviceSchema.index({ displayOrder: 1, name: 1 });

export const Service = model<ServiceDocument>("Service", serviceSchema);
