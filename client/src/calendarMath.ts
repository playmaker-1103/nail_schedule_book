import type { Booking } from "./types";

export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 21;
export const SLOT_MINUTES = 15;
export const ROW_HEIGHT = 40;
export const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 105, 120];

export function timeSlots() {
  const slots: string[] = [];
  for (let minutes = DAY_START_HOUR * 60; minutes < DAY_END_HOUR * 60; minutes += SLOT_MINUTES) {
    slots.push(minutesToTime(minutes));
  }
  return slots;
}

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function endTime(startTime: string, durationMinutes: number) {
  return minutesToTime(timeToMinutes(startTime) + durationMinutes);
}

export function bookingTop(startTime: string) {
  return ((timeToMinutes(startTime) - DAY_START_HOUR * 60) / SLOT_MINUTES) * ROW_HEIGHT;
}

export function bookingHeight(durationMinutes: number) {
  return (durationMinutes / SLOT_MINUTES) * ROW_HEIGHT;
}

export function changeDateByDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

type Layout = { leftPercent: number; widthPercent: number; lane: number; laneCount: number };

function overlaps(a: Booking, b: Booking) {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = aStart + a.durationMinutes;
  const bStart = timeToMinutes(b.startTime);
  const bEnd = bStart + b.durationMinutes;
  return aStart < bEnd && bStart < aEnd;
}

export function layoutOverlaps(bookings: Booking[]): Record<string, Layout> {
  const sorted = [...bookings].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const result: Record<string, Layout> = {};
  const groups: Booking[][] = [];

  for (const booking of sorted) {
    const group = groups.find((existing) => existing.some((item) => overlaps(item, booking)));
    if (group) group.push(booking);
    else groups.push([booking]);
  }

  for (const group of groups) {
    const lanes: Booking[][] = [];
    for (const booking of group) {
      const laneIndex = lanes.findIndex((lane) => lane.every((item) => !overlaps(item, booking)));
      if (laneIndex >= 0) lanes[laneIndex].push(booking);
      else lanes.push([booking]);
      const assignedLane = laneIndex >= 0 ? laneIndex : lanes.length - 1;
      result[booking._id] = {
        lane: assignedLane,
        laneCount: lanes.length,
        leftPercent: 0,
        widthPercent: 100
      };
    }

    const laneCount = lanes.length;
    for (const lane of lanes) {
      for (const booking of lane) {
        result[booking._id] = {
          lane: result[booking._id].lane,
          laneCount,
          leftPercent: (result[booking._id].lane / laneCount) * 100,
          widthPercent: 100 / laneCount
        };
      }
    }
  }

  return result;
}
