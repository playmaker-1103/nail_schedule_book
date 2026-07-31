import { format } from "date-fns";
import { createSupabaseRepository } from "./repository/supabase.js";

const staffSeed = [
  ["Tan", "#0f766e"],
  ["Lee", "#2563eb"],
  ["Tony", "#7c3aed"],
  ["Emily", "#be123c"],
  ["Thang", "#a16207"],
  ["Chau", "#047857"]
] as const;

const serviceSeed = [
  ["BIAB Refill", 45, "#d9f99d"],
  ["BIAB Full Set", 60, "#bbf7d0"],
  ["Shellac Hands", 30, "#bfdbfe"],
  ["Shellac Toes", 30, "#c7d2fe"],
  ["Acrylic Full Set", 75, "#fecdd3"],
  ["Acrylic Refill", 60, "#fed7aa"],
  ["Pedicure", 45, "#ccfbf1"],
  ["Manicure", 30, "#fef08a"],
  ["Removal", 30, "#e5e7eb"],
  ["Nail Art", 15, "#fbcfe8"]
] as const;

async function seed() {
  const repository = createSupabaseRepository();
  const existingStaff = await repository.listStaff();
  const existingServices = await repository.listServices();

  const staffByName = new Map(existingStaff.map((member) => [member.name, member]));
  const serviceByName = new Map(existingServices.map((service) => [service.name, service]));

  const staff = [];
  for (const [name, colour] of staffSeed) {
    const existing = staffByName.get(name);
    staff.push(
      existing ??
        (await repository.createStaff({
          name,
          colour,
          displayOrder: staff.length,
          active: true
        }))
    );
  }

  const services = [];
  for (const [name, defaultDuration, colour] of serviceSeed) {
    const existing = serviceByName.get(name);
    services.push(
      existing ??
        (await repository.createService({
          name,
          defaultDuration,
          colour,
          displayOrder: services.length,
          active: true
        }))
    );
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const todayBookings = await repository.listBookings(today);
  const alreadySeeded = todayBookings.some((booking) => booking.customerName === "Maya" && booking.date === today);

  if (!alreadySeeded) {
    const byStaff = Object.fromEntries(staff.map((member) => [member.name, member._id]));
    const byService = Object.fromEntries(services.map((service) => [service.name, service._id]));

    await Promise.all([
      repository.createBooking({
        customerName: "Maya",
        staffId: byStaff.Tan,
        serviceId: byService["BIAB Refill"],
        date: today,
        startTime: "09:00",
        durationMinutes: 45,
        note: "Prefers short almond"
      }),
      repository.createBooking({
        customerName: "Sarah",
        staffId: byStaff.Lee,
        serviceId: byService["Shellac Hands"],
        date: today,
        startTime: "09:30",
        durationMinutes: 30,
        note: ""
      }),
      repository.createBooking({
        customerName: "Aoife",
        staffId: byStaff.Tony,
        serviceId: byService["Acrylic Full Set"],
        date: today,
        startTime: "11:00",
        durationMinutes: 75,
        note: ""
      }),
      repository.createBooking({
        customerName: "Nina",
        staffId: byStaff.Emily,
        serviceId: byService.Pedicure,
        date: today,
        startTime: "13:15",
        durationMinutes: 45,
        note: ""
      }),
      repository.createBooking({
        customerName: "Grace",
        staffId: byStaff.Tan,
        serviceId: byService["Nail Art"],
        date: today,
        startTime: "09:15",
        durationMinutes: 30,
        note: "Chrome finish"
      })
    ]);
  }

  console.log(`Seeded Supabase staff, services, and example bookings for ${today}.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
