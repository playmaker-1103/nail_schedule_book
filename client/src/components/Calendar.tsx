import { MessageSquare } from "lucide-react";
import {
  bookingHeight,
  bookingTop,
  endTime,
  layoutOverlaps,
  ROW_HEIGHT,
  timeSlots
} from "../calendarMath";
import type { Booking, Service, Staff } from "../types";

type Props = {
  date: string;
  staff: Staff[];
  services: Service[];
  bookings: Booking[];
  search: string;
  onEmptyCellClick: (staffId: string, startTime: string) => void;
  onBookingClick: (booking: Booking) => void;
};

function slotFrameClasses(slot: string, index: number, slotCount: number) {
  const startsHour = slot.endsWith(":00");
  const endsHour = slot.endsWith(":45");
  const isLastSlot = index === slotCount - 1;
  return [
    startsHour ? "border-t-2 border-t-slate-400" : "",
    endsHour || isLastSlot ? "border-b-2 border-b-slate-400" : "border-b border-b-slate-200"
  ].join(" ");
}

export function Calendar({ staff, services, bookings, search, onEmptyCellClick, onBookingClick }: Props) {
  const slots = timeSlots();
  const serviceMap = new Map(services.map((service) => [service._id, service]));
  const filteredBookings = search.trim()
    ? bookings.filter((booking) => booking.customerName.toLowerCase().includes(search.trim().toLowerCase()))
    : bookings;

  if (!staff.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
        Add active staff in Settings to start using the diary.
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg border border-salon-line bg-white shadow-sm">
      <div
        className="min-w-[980px] grid"
        style={{ gridTemplateColumns: `84px repeat(${staff.length}, minmax(150px, 1fr))` }}
      >
        <div className="sticky left-0 top-0 z-50 border-b border-r border-salon-line bg-white px-3 py-3 text-sm font-semibold text-slate-600 shadow-[1px_0_0_#d8dfdc]">
          Time
        </div>
        {staff.map((member) => (
          <div
            key={member._id}
            className="sticky top-0 z-40 border-b border-r border-salon-line bg-white px-3 py-3 text-center font-semibold text-salon-ink"
          >
            <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: member.colour }} />
            {member.name}
          </div>
        ))}

        <div className="sticky left-0 z-30 border-r border-salon-line bg-white shadow-[1px_0_0_#d8dfdc]">
          {slots.map((slot, index) => (
            <div
              key={slot}
              className={`h-10 px-2 pt-1 text-right text-xs ${slotFrameClasses(slot, index, slots.length)} ${
                slot.endsWith(":00") ? "bg-slate-50 font-semibold text-slate-700" : "text-slate-400"
              }`}
            >
              {slot}
            </div>
          ))}
        </div>

        {staff.map((member) => {
          const staffBookings = filteredBookings.filter((booking) => booking.staffId === member._id);
          const layouts = layoutOverlaps(staffBookings);
          return (
            <div
              key={member._id}
              className="calendar-hour-line relative z-0 border-r border-salon-line"
              style={{ height: slots.length * ROW_HEIGHT }}
            >
              <div className="grid" style={{ gridTemplateRows: `repeat(${slots.length}, ${ROW_HEIGHT}px)` }}>
                {slots.map((slot, index) => (
                  <button
                    key={`${member._id}-${slot}`}
                    type="button"
                    onClick={() => onEmptyCellClick(member._id, slot)}
                    className={`h-10 text-left hover:bg-teal-50/80 focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-600 active:bg-teal-100 ${slotFrameClasses(
                      slot,
                      index,
                      slots.length
                    )}`}
                    aria-label={`Create booking with ${member.name} at ${slot}`}
                  />
                ))}
              </div>

              {staffBookings.map((booking) => {
                const service = serviceMap.get(booking.serviceId);
                const layout = layouts[booking._id] ?? { leftPercent: 0, widthPercent: 100 };
                const compact = booking.durationMinutes <= 30;
                return (
                  <button
                    key={booking._id}
                    type="button"
                    onClick={() => onBookingClick(booking)}
                    className="absolute z-[1] overflow-hidden rounded-md border border-black/10 px-2 py-1 text-left shadow-sm ring-1 ring-white/60 hover:z-[2] hover:brightness-95 focus:z-[3] focus:outline-none focus:ring-2 focus:ring-teal-800"
                    style={{
                      top: bookingTop(booking.startTime) + 2,
                      height: Math.max(bookingHeight(booking.durationMinutes) - 4, 30),
                      left: `calc(${layout.leftPercent}% + 3px)`,
                      width: `calc(${layout.widthPercent}% - 6px)`,
                      backgroundColor: service?.colour ?? "#e5e7eb"
                    }}
                  >
                    <div className="truncate text-sm font-bold text-slate-950">{booking.customerName}</div>
                    {!compact ? <div className="truncate text-xs text-slate-800">{service?.name ?? "Service"}</div> : null}
                    {!compact ? (
                      <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-medium text-slate-700">
                        {booking.startTime}-{endTime(booking.startTime, booking.durationMinutes)}
                        {booking.note ? <MessageSquare size={12} aria-label="Has note" /> : null}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
