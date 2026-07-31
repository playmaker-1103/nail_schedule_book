import { Router } from "express";
import { HttpError } from "../errors.js";
import { Staff } from "../models/staff.js";
import { idParamSchema, staffCreateSchema, staffPatchSchema } from "../validation.js";

export const staffRouter = Router();

staffRouter.get("/", async (_req, res, next) => {
  try {
    const staff = await Staff.find().sort({ displayOrder: 1, name: 1 });
    res.json(staff);
  } catch (error) {
    next(error);
  }
});

staffRouter.post("/", async (req, res, next) => {
  try {
    const payload = staffCreateSchema.parse(req.body);
    const staff = await Staff.create(payload);
    res.status(201).json(staff);
  } catch (error) {
    next(error);
  }
});

staffRouter.patch("/:id", async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const payload = staffPatchSchema.parse(req.body);
    const staff = await Staff.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!staff) throw new HttpError(404, "Staff member not found");
    res.json(staff);
  } catch (error) {
    next(error);
  }
});
