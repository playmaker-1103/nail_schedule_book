import { Router } from "express";
import { HttpError } from "../errors.js";
import type { DiaryRepository } from "../repository/types.js";
import { bookingCreateSchema, bookingPatchSchema, dateQuerySchema, idParamSchema } from "../validation.js";

export const bookingsRouter = Router();

function repo(req: Parameters<Parameters<typeof bookingsRouter.get>[1]>[0]) {
  return req.app.locals.repository as DiaryRepository;
}

async function assertReferences(repository: DiaryRepository, payload: { staffId?: string; serviceId?: string }) {
  const [staff, service] = await Promise.all([
    payload.staffId ? repository.staffExists(payload.staffId) : Promise.resolve(true),
    payload.serviceId ? repository.serviceExists(payload.serviceId) : Promise.resolve(true)
  ]);
  if (!staff) throw new HttpError(400, "Selected staff member does not exist");
  if (!service) throw new HttpError(400, "Selected service does not exist");
}

bookingsRouter.get("/", async (req, res, next) => {
  try {
    const { date } = dateQuerySchema.parse(req.query);
    res.json(await repo(req).listBookings(date));
  } catch (error) {
    next(error);
  }
});

bookingsRouter.post("/", async (req, res, next) => {
  try {
    const payload = bookingCreateSchema.parse(req.body);
    await assertReferences(repo(req), payload);
    const booking = await repo(req).createBooking({
      customerName: payload.customerName,
      serviceId: payload.serviceId,
      staffId: payload.staffId,
      date: payload.date,
      startTime: payload.startTime,
      durationMinutes: payload.durationMinutes,
      note: payload.note
    });
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch("/:id", async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const payload = bookingPatchSchema.parse(req.body);
    await assertReferences(repo(req), payload);
    const booking = await repo(req).updateBooking(id, payload);
    if (!booking) throw new HttpError(404, "Booking not found");
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const deleted = await repo(req).deleteBooking(id);
    if (!deleted) throw new HttpError(404, "Booking not found");
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
