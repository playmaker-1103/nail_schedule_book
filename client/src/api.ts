import type { Booking, BookingPayload, Service, ServicePayload, Staff, StaffPayload } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message ?? "Request failed");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  getBookings: (date: string) => request<Booking[]>(`/bookings?date=${date}`),
  createBooking: (payload: BookingPayload) =>
    request<Booking>("/bookings", { method: "POST", body: JSON.stringify(payload) }),
  updateBooking: (id: string, payload: Partial<BookingPayload>) =>
    request<Booking>(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteBooking: (id: string) => request<void>(`/bookings/${id}`, { method: "DELETE" }),
  getStaff: () => request<Staff[]>("/staff"),
  createStaff: (payload: StaffPayload) => request<Staff>("/staff", { method: "POST", body: JSON.stringify(payload) }),
  updateStaff: (id: string, payload: Partial<StaffPayload>) =>
    request<Staff>(`/staff/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  getServices: () => request<Service[]>("/services"),
  createService: (payload: ServicePayload) =>
    request<Service>("/services", { method: "POST", body: JSON.stringify(payload) }),
  updateService: (id: string, payload: Partial<ServicePayload>) =>
    request<Service>(`/services/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
};
