export type Staff = {
  _id: string;
  name: string;
  colour: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Service = {
  _id: string;
  name: string;
  defaultDuration: number;
  colour: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  _id: string;
  customerName: string;
  serviceId: string;
  staffId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type BookingPayload = Omit<Booking, "_id" | "createdAt" | "updatedAt">;

export type StaffPayload = Pick<Staff, "name" | "colour" | "displayOrder" | "active">;
export type ServicePayload = Pick<Service, "name" | "colour" | "displayOrder" | "active" | "defaultDuration">;
