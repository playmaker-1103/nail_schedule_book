import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { Booking, Service, Staff } from "./types";

const staff: Staff[] = [
  {
    _id: "64a000000000000000000001",
    name: "Tan",
    colour: "#0f766e",
    displayOrder: 0,
    active: true,
    createdAt: "",
    updatedAt: ""
  }
];

const services: Service[] = [
  {
    _id: "64a000000000000000000101",
    name: "BIAB Refill",
    defaultDuration: 45,
    colour: "#d9f99d",
    displayOrder: 0,
    active: true,
    createdAt: "",
    updatedAt: ""
  }
];

const bookings: Booking[] = [];

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-07-31T09:00:00"));
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/staff")) return json(staff);
    if (url.includes("/services")) return json(services);
    if (url.includes("/bookings") && init?.method === "POST") {
      const created = { _id: "64a000000000000000000201", createdAt: "", updatedAt: "", ...JSON.parse(String(init.body)) };
      bookings.push(created);
      return json(created, 201);
    }
    if (url.includes("/bookings")) return json(bookings);
    return json({ ok: true });
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  bookings.splice(0);
});

describe("App", () => {
  it("changes calendar dates with next and previous controls", async () => {
    renderApp();
    expect(await screen.findByText("Friday 31 July 2026")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Next day"));
    expect(await screen.findByText("Saturday 1 August 2026")).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Previous day"));
    expect(await screen.findByText("Friday 31 July 2026")).toBeInTheDocument();
  });

  it("creates a booking from an empty calendar cell", async () => {
    renderApp();
    await screen.findByText("Tan");

    await userEvent.click(screen.getByLabelText("Create booking with Tan at 09:00"));
    await userEvent.type(screen.getByLabelText("Customer name"), "Maya");
    await userEvent.click(screen.getByRole("button", { name: "Save booking" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/bookings"), expect.objectContaining({ method: "POST" })));
    expect(await screen.findByText("Maya")).toBeInTheDocument();
  });
});

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

function json(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" }
    })
  );
}
