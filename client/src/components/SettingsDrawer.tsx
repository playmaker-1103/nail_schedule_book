import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DURATION_OPTIONS } from "../calendarMath";
import { useSettingsMutations } from "../hooks";
import type { Service, ServicePayload, Staff, StaffPayload } from "../types";

type Props = {
  staff: Staff[];
  services: Service[];
  onClose: () => void;
};

const staffColours = ["#0f766e", "#2563eb", "#7c3aed", "#be123c", "#a16207", "#047857", "#0891b2", "#c2410c"];
const serviceColours = ["#d9f99d", "#bbf7d0", "#bfdbfe", "#c7d2fe", "#fecdd3", "#fed7aa", "#ccfbf1", "#fef08a", "#e5e7eb", "#fbcfe8"];

type StaffDraft = Pick<Staff, "_id" | "name" | "colour" | "active">;
type ServiceDraft = Pick<Service, "_id" | "name" | "colour" | "defaultDuration" | "active">;

export function SettingsDrawer({ staff, services, onClose }: Props) {
  const mutations = useSettingsMutations();
  const [staffName, setStaffName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceDuration, setServiceDuration] = useState(30);
  const [staffDrafts, setStaffDrafts] = useState<Record<string, StaffDraft>>({});
  const [serviceDrafts, setServiceDrafts] = useState<Record<string, ServiceDraft>>({});

  useEffect(() => {
    setStaffDrafts(Object.fromEntries(staff.map((member) => [member._id, pickStaffDraft(member)])));
  }, [staff]);

  useEffect(() => {
    setServiceDrafts(Object.fromEntries(services.map((service) => [service._id, pickServiceDraft(service)])));
  }, [services]);

  function pickStaffDraft(member: Staff): StaffDraft {
    return { _id: member._id, name: member.name, colour: member.colour, active: member.active };
  }

  function pickServiceDraft(service: Service): ServiceDraft {
    return {
      _id: service._id,
      name: service.name,
      colour: service.colour,
      defaultDuration: service.defaultDuration,
      active: service.active
    };
  }

  function setStaffDraft(id: string, patch: Partial<StaffDraft>) {
    setStaffDrafts((drafts) => ({ ...drafts, [id]: { ...drafts[id], ...patch } as StaffDraft }));
  }

  function setServiceDraft(id: string, patch: Partial<ServiceDraft>) {
    setServiceDrafts((drafts) => ({ ...drafts, [id]: { ...drafts[id], ...patch } as ServiceDraft }));
  }

  function saveStaff(member: Staff, payload: Partial<StaffPayload>) {
    const cleanPayload = "name" in payload && typeof payload.name === "string" ? { ...payload, name: payload.name.trim() } : payload;
    if ("name" in cleanPayload && !cleanPayload.name) {
      setStaffDraft(member._id, { name: member.name });
      return;
    }
    const hasChanges = Object.entries(cleanPayload).some(([key, value]) => member[key as keyof Staff] !== value);
    if (hasChanges) mutations.updateStaff.mutate({ id: member._id, payload: cleanPayload });
  }

  function saveService(service: Service, payload: Partial<ServicePayload>) {
    const cleanPayload = "name" in payload && typeof payload.name === "string" ? { ...payload, name: payload.name.trim() } : payload;
    if ("name" in cleanPayload && !cleanPayload.name) {
      setServiceDraft(service._id, { name: service.name });
      return;
    }
    const hasChanges = Object.entries(cleanPayload).some(([key, value]) => service[key as keyof Service] !== value);
    if (hasChanges) mutations.updateService.mutate({ id: service._id, payload: cleanPayload });
  }

  function moveStaff(member: Staff, direction: -1 | 1) {
    const sorted = [...staff].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
    const index = sorted.findIndex((item) => item._id === member._id);
    const neighbour = sorted[index + direction];
    if (!neighbour) return;
    mutations.updateStaff.mutate({ id: member._id, payload: { displayOrder: neighbour.displayOrder } });
    mutations.updateStaff.mutate({ id: neighbour._id, payload: { displayOrder: member.displayOrder } });
  }

  function moveService(service: Service, direction: -1 | 1) {
    const sorted = [...services].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
    const index = sorted.findIndex((item) => item._id === service._id);
    const neighbour = sorted[index + direction];
    if (!neighbour) return;
    mutations.updateService.mutate({ id: service._id, payload: { displayOrder: neighbour.displayOrder } });
    mutations.updateService.mutate({ id: neighbour._id, payload: { displayOrder: service.displayOrder } });
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <h2 className="text-xl font-semibold text-salon-ink">Settings</h2>
        <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-md hover:bg-slate-100" aria-label="Close settings">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-8 p-5">
        <section>
          <h3 className="mb-3 text-base font-semibold text-salon-ink">Staff</h3>
          <form
            className="mb-4 grid grid-cols-[1fr_auto] gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!staffName.trim()) return;
              mutations.createStaff.mutate({
                name: staffName.trim(),
                colour: staffColours[staff.length % staffColours.length],
                displayOrder: staff.length,
                active: true
              });
              setStaffName("");
            }}
          >
            <input
              value={staffName}
              onChange={(event) => setStaffName(event.target.value)}
              className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-teal-700"
              aria-label="New staff name"
            />
            <button className="grid h-11 w-11 place-items-center rounded-md bg-teal-800 text-white hover:bg-teal-900" aria-label="Add staff">
              <Plus size={18} />
            </button>
          </form>

          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
            {staff.map((member) => (
              <div key={member._id} className="grid grid-cols-[1fr_auto] gap-3 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_92px_92px]">
                  <input
                    value={staffDrafts[member._id]?.name ?? member.name}
                    onChange={(event) => setStaffDraft(member._id, { name: event.target.value })}
                    onBlur={() => saveStaff(member, { name: staffDrafts[member._id]?.name ?? member.name })}
                    className="h-10 rounded-md border border-slate-300 px-2"
                    aria-label={`Rename ${member.name}`}
                  />
                  <input
                    type="color"
                    value={staffDrafts[member._id]?.colour ?? member.colour}
                    onChange={(event) => setStaffDraft(member._id, { colour: event.target.value })}
                    onBlur={() => saveStaff(member, { colour: staffDrafts[member._id]?.colour ?? member.colour })}
                    className="h-10 w-full rounded-md border border-slate-300 p-1"
                    aria-label={`${member.name} colour`}
                  />
                  <label className="flex h-10 items-center gap-2 rounded-md border border-slate-300 px-2 text-sm">
                    <input
                      type="checkbox"
                      checked={staffDrafts[member._id]?.active ?? member.active}
                      onChange={(event) => {
                        setStaffDraft(member._id, { active: event.target.checked });
                        saveStaff(member, { active: event.target.checked });
                      }}
                    />
                    Active
                  </label>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => moveStaff(member, -1)} className="grid h-10 w-10 place-items-center rounded-md border border-slate-300" aria-label="Move staff up">
                    <ArrowUp size={16} />
                  </button>
                  <button onClick={() => moveStaff(member, 1)} className="grid h-10 w-10 place-items-center rounded-md border border-slate-300" aria-label="Move staff down">
                    <ArrowDown size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-salon-ink">Services</h3>
          <form
            className="mb-4 grid grid-cols-[1fr_130px_auto] gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!serviceName.trim()) return;
              mutations.createService.mutate({
                name: serviceName.trim(),
                defaultDuration: serviceDuration,
                colour: serviceColours[services.length % serviceColours.length],
                displayOrder: services.length,
                active: true
              });
              setServiceName("");
            }}
          >
            <input
              value={serviceName}
              onChange={(event) => setServiceName(event.target.value)}
              className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-teal-700"
              aria-label="New service name"
            />
            <select
              value={serviceDuration}
              onChange={(event) => setServiceDuration(Number(event.target.value))}
              className="h-11 rounded-md border border-slate-300 bg-white px-2"
              aria-label="New service duration"
            >
              {DURATION_OPTIONS.map((duration) => (
                <option key={duration} value={duration}>
                  {duration} min
                </option>
              ))}
            </select>
            <button className="grid h-11 w-11 place-items-center rounded-md bg-teal-800 text-white hover:bg-teal-900" aria-label="Add service">
              <Plus size={18} />
            </button>
          </form>

          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
            {services.map((service) => (
              <div key={service._id} className="grid grid-cols-[1fr_auto] gap-3 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_110px_84px_92px]">
                  <input
                    value={serviceDrafts[service._id]?.name ?? service.name}
                    onChange={(event) => setServiceDraft(service._id, { name: event.target.value })}
                    onBlur={() => saveService(service, { name: serviceDrafts[service._id]?.name ?? service.name })}
                    className="h-10 rounded-md border border-slate-300 px-2"
                    aria-label={`Rename ${service.name}`}
                  />
                  <select
                    value={serviceDrafts[service._id]?.defaultDuration ?? service.defaultDuration}
                    onChange={(event) => {
                      const defaultDuration = Number(event.target.value);
                      setServiceDraft(service._id, { defaultDuration });
                      saveService(service, { defaultDuration });
                    }}
                    className="h-10 rounded-md border border-slate-300 bg-white px-2"
                    aria-label={`${service.name} duration`}
                  >
                    {DURATION_OPTIONS.map((duration) => (
                      <option key={duration} value={duration}>
                        {duration} min
                      </option>
                    ))}
                  </select>
                  <input
                    type="color"
                    value={serviceDrafts[service._id]?.colour ?? service.colour}
                    onChange={(event) => setServiceDraft(service._id, { colour: event.target.value })}
                    onBlur={() => saveService(service, { colour: serviceDrafts[service._id]?.colour ?? service.colour })}
                    className="h-10 w-full rounded-md border border-slate-300 p-1"
                    aria-label={`${service.name} colour`}
                  />
                  <label className="flex h-10 items-center gap-2 rounded-md border border-slate-300 px-2 text-sm">
                    <input
                      type="checkbox"
                      checked={serviceDrafts[service._id]?.active ?? service.active}
                      onChange={(event) => {
                        setServiceDraft(service._id, { active: event.target.checked });
                        saveService(service, { active: event.target.checked });
                      }}
                    />
                    Active
                  </label>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => moveService(service, -1)} className="grid h-10 w-10 place-items-center rounded-md border border-slate-300" aria-label="Move service up">
                    <ArrowUp size={16} />
                  </button>
                  <button onClick={() => moveService(service, 1)} className="grid h-10 w-10 place-items-center rounded-md border border-slate-300" aria-label="Move service down">
                    <ArrowDown size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
