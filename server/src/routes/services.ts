import { Router } from "express";
import { HttpError } from "../errors.js";
import type { DiaryRepository } from "../repository/types.js";
import { idParamSchema, serviceCreateSchema, servicePatchSchema } from "../validation.js";

export const servicesRouter = Router();

function repo(req: Parameters<Parameters<typeof servicesRouter.get>[1]>[0]) {
  return req.app.locals.repository as DiaryRepository;
}

servicesRouter.get("/", async (req, res, next) => {
  try {
    res.json(await repo(req).listServices());
  } catch (error) {
    next(error);
  }
});

servicesRouter.post("/", async (req, res, next) => {
  try {
    const payload = serviceCreateSchema.parse(req.body);
    const service = await repo(req).createService({
      displayOrder: 0,
      active: true,
      name: payload.name,
      defaultDuration: payload.defaultDuration,
      colour: payload.colour,
      ...(payload.displayOrder !== undefined ? { displayOrder: payload.displayOrder } : {}),
      ...(payload.active !== undefined ? { active: payload.active } : {})
    });
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
});

servicesRouter.patch("/:id", async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const payload = servicePatchSchema.parse(req.body);
    const service = await repo(req).updateService(id, payload);
    if (!service) throw new HttpError(404, "Service not found");
    res.json(service);
  } catch (error) {
    next(error);
  }
});
