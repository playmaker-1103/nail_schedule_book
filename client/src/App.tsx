import { addDays, format, parseISO } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Search, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { BookingModal } from "./components/BookingModal";
import { Calendar } from "./components/Calendar";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { DURATION_OPTIONS } from "./calendarMath";
import { useBookingMutations, useDiaryData } from "./hooks";
import type { Booking, BookingPayload } from "./types";

type ModalState =
  | null
  | { mode: "create"; staffId: string; startTime: string }
  | { mode: "edit"; booking: Booking };

function todayString() {
  return format(new Date(), "yyyy-MM-dd");
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [search, setSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [recentServiceIds, setRecentServiceIds] = useState<string[]>([]);
  const { bookings, staff, services } = useDiaryData(selectedDate);
  const mutations = useBookingMutations(selectedDate);
  const activeStaff = useMemo(() => (staff.data ?? []).filter((member) => member.active), [staff.data]);
  const activeServices = useMemo(() => (services.data ?? []).filter((service) => service.active), [services.data]);
  const firstService = activeServices[0];
  const saveError =
    mutations.createBooking.error?.message ?? mutations.updateBooking.error?.message ?? mutations.deleteBooking.error?.message;

  const isLoading = bookings.isLoading || staff.isLoading || services.isLoading;
  const loadError = bookings.error?.message ?? staff.error?.message ?? services.error?.message;

  function shiftDate(days: number) {
    setSelectedDate(format(addDays(parseISO(selectedDate), days), "yyyy-MM-dd"));
    setSearch("");
  }

  function createDraft(staffId: string, startTime: string) {
    return {
      customerName: "",
      staffId,
      serviceId: firstService?._id ?? "",
      date: selectedDate,
      startTime,
      durationMinutes: firstService?.defaultDuration ?? DURATION_OPTIONS[1],
      note: ""
    };
  }

  function handleSave(payload: BookingPayload, booking?: Booking) {
    const afterSuccess = () => {
      setRecentServiceIds((current) => [payload.serviceId, ...current.filter((id) => id !== payload.serviceId)].slice(0, 4));
      setModal(null);
    };

    if (booking) {
      mutations.updateBooking.mutate({ id: booking._id, payload }, { onSuccess: afterSuccess });
    } else {
      mutations.createBooking.mutate(payload, { onSuccess: afterSuccess });
    }
  }

  return (
    <main className="min-h-[100dvh] bg-salon-soft text-salon-ink">
      <header className="sticky top-0 z-30 border-b border-salon-line bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3">
          <div className="mr-auto min-w-[230px]">
            <div className="text-sm font-medium text-slate-500">Daily appointment diary</div>
            <h1 className="text-2xl font-bold leading-tight">{format(parseISO(selectedDate), "EEEE d MMMM yyyy")}</h1>
          </div>

          <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white p-1">
            <button onClick={() => shiftDate(-1)} className="grid h-11 w-11 place-items-center rounded-md hover:bg-slate-100" aria-label="Previous day">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setSelectedDate(todayString())} className="h-11 rounded-md px-3 font-semibold hover:bg-slate-100">
              Today
            </button>
            <button onClick={() => shiftDate(1)} className="grid h-11 w-11 place-items-center rounded-md hover:bg-slate-100" aria-label="Next day">
              <ChevronRight size={20} />
            </button>
          </div>

          <label className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setSearch("");
              }}
              className="h-12 rounded-md border border-slate-300 bg-white pl-10 pr-3 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              aria-label="Pick date"
            />
          </label>

          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-12 w-52 rounded-md border border-slate-300 bg-white pl-10 pr-3 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              aria-label="Search customer"
            />
          </label>

          <button
            onClick={() => setSettingsOpen(true)}
            className="grid h-12 w-12 place-items-center rounded-md bg-teal-800 text-white hover:bg-teal-900 active:translate-y-px"
            aria-label="Open settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] p-4">
        {loadError ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">{loadError}</div>
        ) : null}
        {isLoading ? (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
            <div className="h-12 animate-pulse rounded bg-slate-100" />
            <div className="h-[520px] animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <Calendar
            date={selectedDate}
            staff={activeStaff}
            services={services.data ?? []}
            bookings={bookings.data ?? []}
            search={search}
            onEmptyCellClick={(staffId, startTime) => setModal({ mode: "create", staffId, startTime })}
            onBookingClick={(booking) => setModal({ mode: "edit", booking })}
          />
        )}
      </div>

      {settingsOpen ? <SettingsDrawer staff={staff.data ?? []} services={services.data ?? []} onClose={() => setSettingsOpen(false)} /> : null}

      {modal?.mode === "create" ? (
        <BookingModal
          mode="create"
          initial={createDraft(modal.staffId, modal.startTime)}
          staff={activeStaff}
          services={services.data ?? []}
          recentServiceIds={recentServiceIds}
          isSaving={mutations.createBooking.isPending}
          error={saveError}
          onClose={() => setModal(null)}
          onSave={(payload) => handleSave(payload)}
        />
      ) : null}

      {modal?.mode === "edit" ? (
        <BookingModal
          mode="edit"
          booking={modal.booking}
          initial={{
            customerName: modal.booking.customerName,
            staffId: modal.booking.staffId,
            serviceId: modal.booking.serviceId,
            date: modal.booking.date,
            startTime: modal.booking.startTime,
            durationMinutes: modal.booking.durationMinutes,
            note: modal.booking.note ?? ""
          }}
          staff={staff.data ?? []}
          services={services.data ?? []}
          recentServiceIds={recentServiceIds}
          isSaving={mutations.updateBooking.isPending}
          isDeleting={mutations.deleteBooking.isPending}
          error={saveError}
          onClose={() => setModal(null)}
          onSave={(payload) => handleSave(payload, modal.booking)}
          onDelete={() => mutations.deleteBooking.mutate(modal.booking._id, { onSuccess: () => setModal(null) })}
        />
      ) : null}
    </main>
  );
}
