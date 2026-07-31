import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { MemoryRepository } from "./repository/memory.js";

const repository = new MemoryRepository();
const app = createApp(repository);

beforeEach(() => {
  repository.reset();
});

async function fixtures() {
  const staff = await repository.createStaff({ name: "Tan", colour: "#0f766e", displayOrder: 0, active: true });
  const service = await repository.createService({
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
      staffId: staff._id,
      serviceId: service._id,
      date: "2026-07-31",
      startTime: "09:00",
      durationMinutes: 45
    });

    expect(response.status).toBe(201);
    expect(response.body.customerName).toBe("Maya");
    expect(repository.bookings).toHaveLength(1);
  });

  it("edits a booking", async () => {
    const { staff, service } = await fixtures();
    const booking = await repository.createBooking({
      customerName: "Maya",
      staffId: staff._id,
      serviceId: service._id,
      date: "2026-07-31",
      startTime: "09:00",
      durationMinutes: 45,
      note: ""
    });

    const response = await request(app).patch(`/api/bookings/${booking._id}`).send({
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
    const booking = await repository.createBooking({
      customerName: "Maya",
      staffId: staff._id,
      serviceId: service._id,
      date: "2026-07-31",
      startTime: "09:00",
      durationMinutes: 45,
      note: ""
    });

    const response = await request(app).delete(`/api/bookings/${booking._id}`);

    expect(response.status).toBe(204);
    expect(repository.bookings).toHaveLength(0);
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
