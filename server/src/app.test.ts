import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { Booking } from "./models/booking.js";
import { Service } from "./models/service.js";
import { Staff } from "./models/staff.js";

const app = createApp();
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([Booking.deleteMany({}), Staff.deleteMany({}), Service.deleteMany({})]);
});

async function fixtures() {
  const staff = await Staff.create({ name: "Tan", colour: "#0f766e", displayOrder: 0, active: true });
  const service = await Service.create({
    name: "BIAB Refill",
    defaultDuration: 45,
    colour: "#d9f99d",
    displayOrder: 0,
    active: true
  });
  return { staff, service };
}

describe("booking API", () => {
  it("creates a booking", async () => {
    const { staff, service } = await fixtures();

    const response = await request(app).post("/api/bookings").send({
      customerName: "Maya",
      staffId: staff._id.toString(),
      serviceId: service._id.toString(),
      date: "2026-07-31",
      startTime: "09:00",
      durationMinutes: 45
    });

    expect(response.status).toBe(201);
    expect(response.body.customerName).toBe("Maya");
    expect(await Booking.countDocuments()).toBe(1);
  });

  it("edits a booking", async () => {
    const { staff, service } = await fixtures();
    const booking = await Booking.create({
      customerName: "Maya",
      staffId: staff._id,
      serviceId: service._id,
      date: "2026-07-31",
      startTime: "09:00",
      durationMinutes: 45
    });

    const response = await request(app).patch(`/api/bookings/${booking._id.toString()}`).send({
      customerName: "Maya N",
      startTime: "10:15",
      durationMinutes: 60
    });

    expect(response.status).toBe(200);
    expect(response.body.customerName).toBe("Maya N");
    expect(response.body.startTime).toBe("10:15");
  });

  it("deletes a booking", async () => {
    const { staff, service } = await fixtures();
    const booking = await Booking.create({
      customerName: "Maya",
      staffId: staff._id,
      serviceId: service._id,
      date: "2026-07-31",
      startTime: "09:00",
      durationMinutes: 45
    });

    const response = await request(app).delete(`/api/bookings/${booking._id.toString()}`);

    expect(response.status).toBe(204);
    expect(await Booking.countDocuments()).toBe(0);
  });

  it("returns validation errors for invalid bookings", async () => {
    const response = await request(app).post("/api/bookings").send({
      customerName: "",
      staffId: "not-an-id",
      serviceId: "not-an-id",
      date: "31-07-2026",
      startTime: "9",
      durationMinutes: 17
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.issues.length).toBeGreaterThan(0);
  });
});
