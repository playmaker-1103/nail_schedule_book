import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { DURATION_OPTIONS, endTime, timeSlots } from "../calendarMath";
import type { Booking, BookingPayload, Service, Staff } from "../types";
import { ModalShell } from "./ModalShell";

type Draft = {
  customerName: string;
  serviceId: string;
  staffId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  note: string;
};

type Props = {
  mode: "create" | "edit";
  initial: Draft;
  booking?: Booking;
  staff: Staff[];
  services: Service[];
  recentServiceIds: string[];
  isSaving: boolean;
  isDeleting?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (payload: BookingPayload) => void;
  onDelete?: () => void;
};

export function BookingModal({
  mode,
  initial,
  booking,
  staff,
  services,
  recentServiceIds,
  isSaving,
  isDeleting,
  error,
  onClose,
  onSave,
  onDelete
}: Props) {
  const [draft, setDraft] = useState<Draft>(initial);
  const nameRef = useRef<HTMLInputElement>(null);
  const activeServices = services.filter((service) => service.active || service._id === draft.serviceId);
  const sortedServices = useMemo(() => {
    return [...activeServices].sort((a, b) => {
      const aRecent = recentServiceIds.indexOf(a._id);
      const bRecent = recentServiceIds.indexOf(b._id);
      if (aRecent !== -1 || bRecent !== -1) return (aRecent === -1 ? 999 : aRecent) - (bRecent === -1 ? 999 : bRecent);
      return a.displayOrder - b.displayOrder;
    });
  }, [activeServices, recentServiceIds]);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const selectedStaff = staff.find((member) => member._id === draft.staffId);
  const selectedService = services.find((service) => service._id === draft.serviceId);
  const canSave = draft.customerName.trim() && draft.serviceId && draft.staffId && draft.date && draft.startTime && !isSaving;
  const slots = useMemo(() => timeSlots(), []);

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    onSave({
      customerName: draft.customerName.trim(),
      serviceId: draft.serviceId,
      staffId: draft.staffId,
      date: draft.date,
      startTime: draft.startTime,
      durationMinutes: Number(draft.durationMinutes),
      note: draft.note.trim()
    });
  }

  return (
    <ModalShell title={mode === "create" ? "New booking" : "Edit booking"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 p-4">
        <div className="rounded-md border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-950">
          <div className="font-semibold">{selectedStaff?.name ?? "Staff"} · {format(parseISO(draft.date), "EEE d MMM")} · {draft.startTime}-{endTime(draft.startTime, Number(draft.durationMinutes))}</div>
          {selectedService ? <div className="text-teal-800">{selectedService.name}</div> : null}
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Customer name</span>
          <input
            ref={nameRef}
            value={draft.customerName}
            onChange={(event) => setField("customerName", event.target.value)}
            className="h-12 w-full rounded-md border border-slate-300 px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Service</span>
          <select
            value={draft.serviceId}
            onChange={(event) => {
              const service = services.find((item) => item._id === event.target.value);
              setDraft((current) => ({
                ...current,
                serviceId: event.target.value,
                durationMinutes: service?.defaultDuration ?? current.durationMinutes
              }));
            }}
            className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            required
          >
            <option value="">Select service</option>
            {sortedServices.map((service) => (
              <option key={service._id} value={service._id}>
                {service.name} · {service.defaultDuration} min
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Duration</span>
          <select
            value={draft.durationMinutes}
            onChange={(event) => setField("durationMinutes", Number(event.target.value))}
            className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            required
          >
            {DURATION_OPTIONS.map((duration) => (
              <option key={duration} value={duration}>
                {duration} minutes
              </option>
            ))}
          </select>
        </label>

        {mode === "edit" ? (
          <section className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div>
              <h3 className="text-sm font-semibold text-salon-ink">Change schedule</h3>
              <p className="text-xs text-slate-600">Move this booking to another staff member, day, or start time.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">Employee</span>
                <select
                  value={draft.staffId}
                  onChange={(event) => setField("staffId", event.target.value)}
                  className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                >
                  {staff.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Date</span>
              <input
                type="date"
                value={draft.date}
                onChange={(event) => setField("date", event.target.value)}
                className="h-12 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Start time</span>
              <select
                value={draft.startTime}
                onChange={(event) => setField("startTime", event.target.value)}
                className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              >
                {slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>
          </div>
          </section>
        ) : null}

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Optional note</span>
          <input
            value={draft.note}
            onChange={(event) => setField("note", event.target.value)}
            className="h-12 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>

        {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          {mode === "edit" && booking ? (
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                if (window.confirm("Delete this booking?")) onDelete?.();
              }}
              className="h-11 rounded-md border border-red-200 px-4 font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 active:translate-y-px"
            >
              {isDeleting ? "Deleting..." : "Delete booking"}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-11 rounded-md border border-slate-300 px-4 font-medium hover:bg-slate-50 active:translate-y-px">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="h-11 rounded-md bg-teal-800 px-4 font-semibold text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-px"
            >
              {isSaving ? "Saving..." : mode === "create" ? "Save booking" : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
