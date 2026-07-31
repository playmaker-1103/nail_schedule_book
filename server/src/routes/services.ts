import { Router } from "express";
import { HttpError } from "../errors.js";
import { Service } from "../models/service.js";
import { idParamSchema, serviceCreateSchema, servicePatchSchema } from "../validation.js";

export const servicesRouter = Router();

servicesRouter.get("/", async (_req, res, next) => {
  try {
    const services = await Service.find().sort({ displayOrder: 1, name: 1 });
    res.json(services);
  } catch (error) {
    next(error);
  }
});

servicesRouter.post("/", async (req, res, next) => {
  try {
    const payload = serviceCreateSchema.parse(req.body);
    const service = await Service.create(payload);
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
});

servicesRouter.patch("/:id", async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const payload = servicePatchSchema.parse(req.body);
    const service = await Service.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!service) throw new HttpError(404, "Service not found");
    res.json(service);
  } catch (error) {
    next(error);
  }
});
