import { Router } from "express";
import { HttpError } from "../errors.js";
import { idParamSchema, staffCreateSchema, staffPatchSchema } from "../validation.js";
import type { DiaryRepository } from "../repository/types.js";

export const staffRouter = Router();

function repo(req: Parameters<Parameters<typeof staffRouter.get>[1]>[0]) {
  return req.app.locals.repository as DiaryRepository;
}

staffRouter.get("/", async (req, res, next) => {
  try {
    res.json(await repo(req).listStaff());
  } catch (error) {
    next(error);
  }
});

staffRouter.post("/", async (req, res, next) => {
  try {
    const payload = staffCreateSchema.parse(req.body);
    const staff = await repo(req).createStaff({
      displayOrder: 0,
      active: true,
      name: payload.name,
      colour: payload.colour,
      ...(payload.displayOrder !== undefined ? { displayOrder: payload.displayOrder } : {}),
      ...(payload.active !== undefined ? { active: payload.active } : {})
    });
    res.status(201).json(staff);
  } catch (error) {
    next(error);
  }
});

staffRouter.patch("/:id", async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const payload = staffPatchSchema.parse(req.body);
    const staff = await repo(req).updateStaff(id, payload);
    if (!staff) throw new HttpError(404, "Staff member not found");
    res.json(staff);
  } catch (error) {
    next(error);
  }
});
