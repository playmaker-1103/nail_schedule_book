# iOS Internal App Plan

This plan keeps the current production architecture:

```text
iOS internal app -> Vercel REST API -> Supabase Postgres
```

The iOS app must not connect to Supabase directly and must never contain `SUPABASE_SERVICE_ROLE_KEY`.

## Goal

Build a private iOS appointment diary for salon staff that uses the existing backend and database. The web app can continue running at the same time.

Production API base URL:

```text
https://nail-schedule-book.vercel.app/api
```

## Why This Approach

- Reuses the existing Express API and Zod validation.
- Keeps Supabase credentials on Vercel only.
- Lets web and iOS share the same booking data.
- Avoids writing Supabase RLS/Auth policies before the native app exists.
- Makes the first iOS version mostly a UI/client project.

## Required Backend Setup

Keep these Vercel environment variables:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
CLIENT_ORIGIN=https://nail-schedule-book.vercel.app
```

For a native iOS app, CORS is not the main protection layer. The API should later add authentication before real-world use.

Recommended before distributing the app:

- Add a simple staff login or shared salon passcode.
- Require that auth token/passcode on every API request.
- Add soft delete for bookings if accidental deletion becomes a concern.
- Keep Supabase backups enabled.

## API Endpoints To Use

All requests use JSON.

Headers:

```http
Content-Type: application/json
```

### Health

```http
GET /api/health
```

Expected response:

```json
{ "ok": true }
```

### Staff

```http
GET /api/staff
POST /api/staff
PATCH /api/staff/:id
```

Staff shape:

```json
{
  "_id": "uuid",
  "name": "Tan",
  "colour": "#0f766e",
  "displayOrder": 0,
  "active": true,
  "createdAt": "2026-07-31T00:00:00Z",
  "updatedAt": "2026-07-31T00:00:00Z"
}
```

Only active staff should appear on the diary screen.

### Services

```http
GET /api/services
POST /api/services
PATCH /api/services/:id
```

Service shape:

```json
{
  "_id": "uuid",
  "name": "BIAB Refill",
  "defaultDuration": 45,
  "colour": "#d9f99d",
  "displayOrder": 0,
  "active": true,
  "createdAt": "2026-07-31T00:00:00Z",
  "updatedAt": "2026-07-31T00:00:00Z"
}
```

Only active services should appear when creating a booking.

### Bookings

```http
GET /api/bookings?date=yyyy-MM-dd
POST /api/bookings
PATCH /api/bookings/:id
DELETE /api/bookings/:id
```

Booking shape:

```json
{
  "_id": "uuid",
  "customerName": "Maya",
  "serviceId": "uuid",
  "staffId": "uuid",
  "date": "2026-07-31",
  "startTime": "10:15",
  "durationMinutes": 45,
  "note": "Prefers short almond",
  "createdAt": "2026-07-31T00:00:00Z",
  "updatedAt": "2026-07-31T00:00:00Z"
}
```

Important:

- `date` is a `yyyy-MM-dd` string.
- `startTime` is `HH:mm`.
- Do not calculate availability.
- Do not reject overlaps.
- Refresh bookings after successful create/update/delete.

## iOS MVP Screens

### 1. Daily Diary

Default screen after opening the app.

Features:

- Date header.
- Previous day, Today, Next day.
- Staff columns.
- Time rows every 15 minutes.
- Working range: `10:00` to `20:30`.
- Tap empty cell to create booking.
- Tap existing booking to edit/delete.

Use the same mental model as the web app. The app is a fast internal diary, not a customer booking system.

### 2. Create Booking Sheet

Open after tapping an empty slot.

Pre-filled:

- Date
- Staff
- Start time

Fields:

- Customer name, required, autofocus if practical.
- Service, required.
- Duration, default from selected service.
- Optional note.

Actions:

- Cancel
- Save booking

After save succeeds, close the sheet and refetch bookings for the visible date.

### 3. Edit Booking Sheet

Open after tapping a booking.

Editable:

- Customer name
- Service
- Duration
- Staff
- Date
- Start time
- Note

Actions:

- Save changes
- Delete booking
- Cancel

Require confirmation before delete.

### 4. Settings

Keep this secondary.

Features:

- Staff list: add, rename, reorder, active flag, colour.
- Services list: add, edit, reorder, active flag, colour, default duration.

## Suggested Swift Project Structure

```text
NailSchedule/
  App/
    NailScheduleApp.swift
  API/
    APIClient.swift
    APIError.swift
  Models/
    Booking.swift
    Staff.swift
    Service.swift
  Diary/
    DiaryView.swift
    DiaryViewModel.swift
    CalendarGridView.swift
    BookingBlockView.swift
  BookingForm/
    BookingFormView.swift
    BookingFormViewModel.swift
  Settings/
    SettingsView.swift
    StaffSettingsView.swift
    ServiceSettingsView.swift
  Utilities/
    DateFormatting.swift
    CalendarMath.swift
```

## Swift Models

Use `Codable`.

```swift
struct Staff: Codable, Identifiable {
    let id: String
    var name: String
    var colour: String
    var displayOrder: Int
    var active: Bool

    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, colour, displayOrder, active
    }
}
```

Use the same `_id -> id` mapping for `Service` and `Booking`.

## Calendar Math

Match the web app:

```text
slotMinutes = 15
rowHeight = app-specific
startMinutes = 10 * 60
endMinutes = 20 * 60 + 30
slots include both 10:00 and 20:30
```

Booking vertical offset:

```text
((bookingStartMinutes - startMinutes) / 15) * rowHeight
```

Booking height:

```text
(durationMinutes / 15) * rowHeight
```

## API Client Notes

Use `URLSession`.

Base URL should be configurable:

```swift
let baseURL = URL(string: "https://nail-schedule-book.vercel.app/api")!
```

For create/update/delete:

- Disable double submit while request is running.
- Show a clear error message if the request fails.
- Refetch the affected date after success.

## Data Safety

The iOS app should treat the Vercel API as the source of truth.

Do:

- Save first, then update UI after success.
- Refetch bookings after writes.
- Keep dates as `yyyy-MM-dd` strings.
- Keep Supabase service role key only in Vercel.

Do not:

- Store service role key in iOS.
- Call Supabase directly from iOS in this approach.
- Build local-only booking storage as the primary data store.
- Reject overlapping bookings.

## Internal Distribution Options

Good options:

- Apple Business Manager / Custom App distribution.
- TestFlight for small internal testing.
- Direct device install only for development.

If the salon only uses iPads and wants the fastest path, also consider keeping the web app and adding it to the Home Screen first. Native iOS can come after the workflow is proven.

## First Implementation Milestones

1. Create SwiftUI project.
2. Implement models and API client.
3. Load staff, services, and bookings for today.
4. Build diary grid from `10:00` to `20:30`.
5. Create booking from tapped cell.
6. Edit and delete existing booking.
7. Add Settings screen.
8. Add simple authentication before real use.
9. Test on iPad landscape.
10. Distribute internally.

