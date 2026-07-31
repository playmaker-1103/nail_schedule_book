import { describe, expect, it } from "vitest";
import { format } from "date-fns";
import { bookingHeight, bookingTop, changeDateByDays, layoutOverlaps, timeSlots } from "./calendarMath";
import type { Booking } from "./types";

describe("calendar math", () => {
  it("builds 15-minute slots from 10:00 to 20:30", () => {
    const slots = timeSlots();
    expect(slots.slice(0, 4)).toEqual(["10:00", "10:15", "10:30", "10:45"]);
    expect(slots.at(-1)).toBe("20:30");
  });

  it("calculates visual height from duration", () => {
    expect(bookingHeight(15)).toBe(40);
    expect(bookingHeight(60)).toBe(160);
    expect(bookingHeight(120)).toBe(320);
  });

  it("positions a booking from its start time", () => {
    expect(bookingTop("10:00")).toBe(0);
    expect(bookingTop("10:15")).toBe(40);
    expect(bookingTop("12:00")).toBe(320);
  });

  it("changes calendar dates", () => {
    expect(format(changeDateByDays(new Date(2026, 6, 31), 1), "yyyy-MM-dd")).toBe("2026-08-01");
    expect(format(changeDateByDays(new Date(2026, 6, 31), -1), "yyyy-MM-dd")).toBe("2026-07-30");
  });

  it("places overlapping bookings into lanes", () => {
    const bookings = [
      booking("1", "09:00", 60),
      booking("2", "09:30", 30),
      booking("3", "10:15", 30)
    ];

    const layout = layoutOverlaps(bookings);

    expect(layout["1"].widthPercent).toBe(50);
    expect(layout["2"].leftPercent).toBe(50);
    expect(layout["3"].widthPercent).toBe(100);
  });
});

function booking(_id: string, startTime: string, durationMinutes: number): Booking {
  return {
    _id,
    customerName: "Customer",
    serviceId: "service",
    staffId: "staff",
    date: "2026-07-31",
    startTime,
    durationMinutes,
    createdAt: "",
    updatedAt: ""
  };
}
