import crypto from "node:crypto";
import type {
  BookingInput,
  BookingPatch,
  BookingRecord,
  DiaryRepository,
  ServiceInput,
  ServicePatch,
  ServiceRecord,
  StaffInput,
  StaffPatch,
  StaffRecord
} from "./types.js";

export class MemoryRepository implements DiaryRepository {
  staff: StaffRecord[] = [];
  services: ServiceRecord[] = [];
  bookings: BookingRecord[] = [];

  reset() {
    this.staff = [];
    this.services = [];
    this.bookings = [];
  }

  async listStaff() {
    return [...this.staff].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
  }

  async createStaff(input: StaffInput) {
    const record = withMeta(input);
    this.staff.push(record);
    return record;
  }

  async updateStaff(id: string, patch: StaffPatch) {
    const record = this.staff.find((item) => item._id === id);
    if (!record) return null;
    Object.assign(record, patch, { updatedAt: new Date().toISOString() });
    return record;
  }

  async staffExists(id: string) {
    return this.staff.some((item) => item._id === id);
  }

  async listServices() {
    return [...this.services].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
  }

  async createService(input: ServiceInput) {
    const record = withMeta(input);
    this.services.push(record);
    return record;
  }

  async updateService(id: string, patch: ServicePatch) {
    const record = this.services.find((item) => item._id === id);
    if (!record) return null;
    Object.assign(record, patch, { updatedAt: new Date().toISOString() });
    return record;
  }

  async serviceExists(id: string) {
    return this.services.some((item) => item._id === id);
  }

  async listBookings(date: string) {
    return [...this.bookings]
      .filter((booking) => booking.date === date)
      .sort((a, b) => a.staffId.localeCompare(b.staffId) || a.startTime.localeCompare(b.startTime) || a.createdAt.localeCompare(b.createdAt));
  }

  async createBooking(input: BookingInput) {
    const record = withMeta(input);
    this.bookings.push(record);
    return record;
  }

  async updateBooking(id: string, patch: BookingPatch) {
    const record = this.bookings.find((item) => item._id === id);
    if (!record) return null;
    Object.assign(record, patch, { updatedAt: new Date().toISOString() });
    return record;
  }

  async deleteBooking(id: string) {
    const initialLength = this.bookings.length;
    this.bookings = this.bookings.filter((item) => item._id !== id);
    return this.bookings.length !== initialLength;
  }
}

function withMeta<T extends object>(input: T): T & { _id: string; createdAt: string; updatedAt: string } {
  const now = new Date().toISOString();
  return {
    _id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...input
  };
}
