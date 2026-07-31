import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { BookingPayload, ServicePayload, StaffPayload } from "./types";

export function useDiaryData(date: string) {
  const bookings = useQuery({ queryKey: ["bookings", date], queryFn: () => api.getBookings(date) });
  const staff = useQuery({ queryKey: ["staff"], queryFn: api.getStaff });
  const services = useQuery({ queryKey: ["services"], queryFn: api.getServices });
  return { bookings, staff, services };
}

export function useBookingMutations(date: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["bookings", date] });

  return {
    createBooking: useMutation({ mutationFn: (payload: BookingPayload) => api.createBooking(payload), onSuccess: invalidate }),
    updateBooking: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<BookingPayload> }) => api.updateBooking(id, payload),
      onSuccess: (_booking, variables) => {
        invalidate();
        if (variables.payload.date && variables.payload.date !== date) {
          queryClient.invalidateQueries({ queryKey: ["bookings", variables.payload.date] });
        }
      }
    }),
    deleteBooking: useMutation({ mutationFn: (id: string) => api.deleteBooking(id), onSuccess: invalidate })
  };
}

export function useSettingsMutations() {
  const queryClient = useQueryClient();
  return {
    createStaff: useMutation({
      mutationFn: (payload: StaffPayload) => api.createStaff(payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] })
    }),
    updateStaff: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<StaffPayload> }) => api.updateStaff(id, payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] })
    }),
    createService: useMutation({
      mutationFn: (payload: ServicePayload) => api.createService(payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] })
    }),
    updateService: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<ServicePayload> }) => api.updateService(id, payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] })
    })
  };
}
