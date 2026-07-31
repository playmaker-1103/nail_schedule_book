import { Router } from "express";
import { HttpError } from "../errors.js";
import { Booking } from "../models/booking.js";
import { Service } from "../models/service.js";
import { Staff } from "../models/staff.js";
import { bookingCreateSchema, bookingPatchSchema, dateQuerySchema, idParamSchema } from "../validation.js";

export const bookingsRouter = Router();

async function assertReferences(payload: { staffId?: string; serviceId?: string }) {
  const [staff, service] = await Promise.all([
    payload.staffId ? Staff.exists({ _id: payload.staffId }) : Promise.resolve(true),
    payload.serviceId ? Service.exists({ _id: payload.serviceId }) : Promise.resolve(true)
  ]);
  if (!staff) throw new HttpError(400, "Selected staff member does not exist");
  if (!service) throw new HttpError(400, "Selected service does not exist");
}

bookingsRouter.get("/", async (req, res, next) => {
  try {
    const { date } = dateQuerySchema.parse(req.query);
    const bookings = await Booking.find({ date }).sort({ staffId: 1, startTime: 1, createdAt: 1 });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.post("/", async (req, res, next) => {
  try {
    const payload = bookingCreateSchema.parse(req.body);
    await assertReferences(payload);
    const booking = await Booking.create(payload);
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch("/:id", async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const payload = bookingPatchSchema.parse(req.body);
    await assertReferences(payload);
    const booking = await Booking.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!booking) throw new HttpError(404, "Booking not found");
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) throw new HttpError(404, "Booking not found");
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
