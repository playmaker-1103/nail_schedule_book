import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config.js";
import { HttpError } from "../errors.js";
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

type StaffRow = {
  id: string;
  name: string;
  colour: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type ServiceRow = {
  id: string;
  name: string;
  default_duration: number;
  colour: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type BookingRow = {
  id: string;
  customer_name: string;
  service_id: string;
  staff_id: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

let client: SupabaseClient | null = null;

function getClient() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new HttpError(500, "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return client;
}

function mapStaff(row: StaffRow): StaffRecord {
  return {
    _id: row.id,
    name: row.name,
    colour: row.colour,
    displayOrder: row.display_order,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapService(row: ServiceRow): ServiceRecord {
  return {
    _id: row.id,
    name: row.name,
    defaultDuration: row.default_duration,
    colour: row.colour,
    displayOrder: row.display_order,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapBooking(row: BookingRow): BookingRecord {
  return {
    _id: row.id,
    customerName: row.customer_name,
    serviceId: row.service_id,
    staffId: row.staff_id,
    date: row.date,
    startTime: row.start_time.slice(0, 5),
    durationMinutes: row.duration_minutes,
    note: row.note ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function staffToRow(input: StaffInput | StaffPatch) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.colour !== undefined ? { colour: input.colour } : {}),
    ...(input.displayOrder !== undefined ? { display_order: input.displayOrder } : {}),
    ...(input.active !== undefined ? { active: input.active } : {})
  };
}

function serviceToRow(input: ServiceInput | ServicePatch) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.defaultDuration !== undefined ? { default_duration: input.defaultDuration } : {}),
    ...(input.colour !== undefined ? { colour: input.colour } : {}),
    ...(input.displayOrder !== undefined ? { display_order: input.displayOrder } : {}),
    ...(input.active !== undefined ? { active: input.active } : {})
  };
}

function bookingToRow(input: BookingInput | BookingPatch) {
  return {
    ...(input.customerName !== undefined ? { customer_name: input.customerName } : {}),
    ...(input.serviceId !== undefined ? { service_id: input.serviceId } : {}),
    ...(input.staffId !== undefined ? { staff_id: input.staffId } : {}),
    ...(input.date !== undefined ? { date: input.date } : {}),
    ...(input.startTime !== undefined ? { start_time: input.startTime } : {}),
    ...(input.durationMinutes !== undefined ? { duration_minutes: input.durationMinutes } : {}),
    ...(input.note !== undefined ? { note: input.note } : {})
  };
}

function throwIfError(error: unknown) {
  if (error) {
    const message = error instanceof Error ? error.message : "Database request failed";
    throw new HttpError(500, message);
  }
}

export function createSupabaseRepository(): DiaryRepository {
  return {
    async listStaff() {
      const { data, error } = await getClient().from("staff").select("*").order("display_order").order("name");
      throwIfError(error);
      return (data as StaffRow[]).map(mapStaff);
    },
    async createStaff(input) {
      const { data, error } = await getClient().from("staff").insert(staffToRow(input)).select("*").single();
      throwIfError(error);
      return mapStaff(data as StaffRow);
    },
    async updateStaff(id, patch) {
      const { data, error } = await getClient().from("staff").update(staffToRow(patch)).eq("id", id).select("*").maybeSingle();
      throwIfError(error);
      return data ? mapStaff(data as StaffRow) : null;
    },
    async staffExists(id) {
      const { data, error } = await getClient().from("staff").select("id").eq("id", id).maybeSingle();
      throwIfError(error);
      return Boolean(data);
    },
    async listServices() {
      const { data, error } = await getClient().from("services").select("*").order("display_order").order("name");
      throwIfError(error);
      return (data as ServiceRow[]).map(mapService);
    },
    async createService(input) {
      const { data, error } = await getClient().from("services").insert(serviceToRow(input)).select("*").single();
      throwIfError(error);
      return mapService(data as ServiceRow);
    },
    async updateService(id, patch) {
      const { data, error } = await getClient().from("services").update(serviceToRow(patch)).eq("id", id).select("*").maybeSingle();
      throwIfError(error);
      return data ? mapService(data as ServiceRow) : null;
    },
    async serviceExists(id) {
      const { data, error } = await getClient().from("services").select("id").eq("id", id).maybeSingle();
      throwIfError(error);
      return Boolean(data);
    },
    async listBookings(date) {
      const { data, error } = await getClient()
        .from("bookings")
        .select("*")
        .eq("date", date)
        .order("staff_id")
        .order("start_time")
        .order("created_at");
      throwIfError(error);
      return (data as BookingRow[]).map(mapBooking);
    },
    async createBooking(input) {
      const { data, error } = await getClient().from("bookings").insert(bookingToRow(input)).select("*").single();
      throwIfError(error);
      return mapBooking(data as BookingRow);
    },
    async updateBooking(id, patch) {
      const { data, error } = await getClient().from("bookings").update(bookingToRow(patch)).eq("id", id).select("*").maybeSingle();
      throwIfError(error);
      return data ? mapBooking(data as BookingRow) : null;
    },
    async deleteBooking(id) {
      const { data, error } = await getClient().from("bookings").delete().eq("id", id).select("id").maybeSingle();
      throwIfError(error);
      return Boolean(data);
    }
  };
}
