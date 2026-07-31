import { format } from "date-fns";
import { connectDb, disconnectDb } from "./db.js";
import { Booking } from "./models/booking.js";
import { Service } from "./models/service.js";
import { Staff } from "./models/staff.js";

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
  await connectDb();
  await Promise.all([Booking.deleteMany({}), Staff.deleteMany({}), Service.deleteMany({})]);

  const staff = await Staff.insertMany(
    staffSeed.map(([name, colour], displayOrder) => ({ name, colour, displayOrder, active: true }))
  );
  const services = await Service.insertMany(
    serviceSeed.map(([name, defaultDuration, colour], displayOrder) => ({
      name,
      defaultDuration,
      colour,
      displayOrder,
      active: true
    }))
  );

  const today = format(new Date(), "yyyy-MM-dd");
  const byStaff = Object.fromEntries(staff.map((member) => [member.name, member._id]));
  const byService = Object.fromEntries(services.map((service) => [service.name, service._id]));

  await Booking.insertMany([
    {
      customerName: "Maya",
      staffId: byStaff.Tan,
      serviceId: byService["BIAB Refill"],
      date: today,
      startTime: "09:00",
      durationMinutes: 45,
      note: "Prefers short almond"
    },
    {
      customerName: "Sarah",
      staffId: byStaff.Lee,
      serviceId: byService["Shellac Hands"],
      date: today,
      startTime: "09:30",
      durationMinutes: 30
    },
    {
      customerName: "Aoife",
      staffId: byStaff.Tony,
      serviceId: byService["Acrylic Full Set"],
      date: today,
      startTime: "11:00",
      durationMinutes: 75
    },
    {
      customerName: "Nina",
      staffId: byStaff.Emily,
      serviceId: byService.Pedicure,
      date: today,
      startTime: "13:15",
      durationMinutes: 45
    },
    {
      customerName: "Grace",
      staffId: byStaff.Tan,
      serviceId: byService["Nail Art"],
      date: today,
      startTime: "09:15",
      durationMinutes: 30,
      note: "Chrome finish"
    }
  ]);

  console.log(`Seeded ${staff.length} staff, ${services.length} services, and example bookings for ${today}.`);
  await disconnectDb();
}

seed().catch(async (error) => {
  console.error(error);
  await disconnectDb();
  process.exit(1);
});
