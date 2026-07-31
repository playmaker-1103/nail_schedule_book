export type StaffRecord = {
  _id: string;
  name: string;
  colour: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServiceRecord = {
  _id: string;
  name: string;
  defaultDuration: number;
  colour: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BookingRecord = {
  _id: string;
  customerName: string;
  serviceId: string;
  staffId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type StaffInput = Omit<StaffRecord, "_id" | "createdAt" | "updatedAt">;
export type ServiceInput = Omit<ServiceRecord, "_id" | "createdAt" | "updatedAt">;
export type BookingInput = Omit<BookingRecord, "_id" | "createdAt" | "updatedAt">;

export type StaffPatch = Partial<StaffInput>;
export type ServicePatch = Partial<ServiceInput>;
export type BookingPatch = Partial<BookingInput>;

export interface DiaryRepository {
  listStaff(): Promise<StaffRecord[]>;
  createStaff(input: StaffInput): Promise<StaffRecord>;
  updateStaff(id: string, patch: StaffPatch): Promise<StaffRecord | null>;
  staffExists(id: string): Promise<boolean>;

  listServices(): Promise<ServiceRecord[]>;
  createService(input: ServiceInput): Promise<ServiceRecord>;
  updateService(id: string, patch: ServicePatch): Promise<ServiceRecord | null>;
  serviceExists(id: string): Promise<boolean>;

  listBookings(date: string): Promise<BookingRecord[]>;
  createBooking(input: BookingInput): Promise<BookingRecord>;
  updateBooking(id: string, patch: BookingPatch): Promise<BookingRecord | null>;
  deleteBooking(id: string): Promise<boolean>;
}
