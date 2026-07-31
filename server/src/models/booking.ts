import { Schema, model, Types } from "mongoose";

export interface BookingDocument {
  _id: string;
  customerName: string;
  serviceId: Types.ObjectId;
  staffId: Types.ObjectId;
  date: string;
  startTime: string;
  durationMinutes: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<BookingDocument>(
  {
    customerName: { type: String, required: true, trim: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 15, max: 240 },
    note: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

bookingSchema.index({ date: 1, staffId: 1, startTime: 1 });
bookingSchema.index({ date: 1, customerName: 1 });

export const Booking = model<BookingDocument>("Booking", bookingSchema);
