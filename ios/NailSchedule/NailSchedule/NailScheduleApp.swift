import SwiftUI
import Combine

private let apiBaseURL = URL(string: "https://nail-schedule-book.vercel.app/api")!
private let slotMinutes = 15
private let rowHeight: CGFloat = 44
private let dayStartMinutes = 10 * 60
private let dayEndMinutes = 20 * 60 + 30
private let durationOptions = [15, 30, 45, 60, 75, 90, 105, 120]

@main
struct NailScheduleApp: App {
    var body: some Scene {
        WindowGroup {
            DiaryView()
        }
    }
}

struct Staff: Codable, Identifiable, Equatable {
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

struct Service: Codable, Identifiable, Equatable {
    let id: String
    var name: String
    var defaultDuration: Int
    var colour: String
    var displayOrder: Int
    var active: Bool

    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, defaultDuration, colour, displayOrder, active
    }
}

struct Booking: Codable, Identifiable, Equatable {
    let id: String
    var customerName: String
    var serviceId: String
    var staffId: String
    var date: String
    var startTime: String
    var durationMinutes: Int
    var note: String?

    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case customerName, serviceId, staffId, date, startTime, durationMinutes, note
    }
}

struct BookingPayload: Codable {
    var customerName: String
    var serviceId: String
    var staffId: String
    var date: String
    var startTime: String
    var durationMinutes: Int
    var note: String
}

struct BookingDraft: Identifiable {
    var id = UUID()
    var existingBookingId: String?
    var customerName = ""
    var serviceId = ""
    var staffId = ""
    var date = ""
    var startTime = "10:00"
    var durationMinutes = 30
    var note = ""

    var isEditing: Bool {
        existingBookingId != nil
    }
}

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case server(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL"
        case .invalidResponse:
            return "Invalid server response"
        case .server(let message):
            return message
        }
    }
}

final class APIClient {
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    func getStaff() async throws -> [Staff] {
        try await request("/staff")
    }

    func getServices() async throws -> [Service] {
        try await request("/services")
    }

    func getBookings(date: String) async throws -> [Booking] {
        try await request("/bookings?date=\(date)")
    }

    func createBooking(_ payload: BookingPayload) async throws -> Booking {
        try await request("/bookings", method: "POST", body: payload)
    }

    func updateBooking(id: String, payload: BookingPayload) async throws -> Booking {
        try await request("/bookings/\(id)", method: "PATCH", body: payload)
    }

    func deleteBooking(id: String) async throws {
        let _: EmptyResponse = try await request("/bookings/\(id)", method: "DELETE")
    }

    private func request<T: Decodable>(_ path: String, method: String = "GET") async throws -> T {
        try await request(path, method: method, body: Optional<Data>.none)
    }

    private func request<T: Decodable, Body: Encodable>(_ path: String, method: String, body: Body?) async throws -> T {
        guard let url = URL(string: apiBaseURL.absoluteString + path) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let body {
            request.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        if http.statusCode == 204 {
            return EmptyResponse() as! T
        }

        guard (200..<300).contains(http.statusCode) else {
            if let error = try? decoder.decode(ServerError.self, from: data) {
                throw APIError.server(error.message)
            }
            throw APIError.server("Request failed with status \(http.statusCode)")
        }

        return try decoder.decode(T.self, from: data)
    }
}

struct EmptyResponse: Decodable {}

struct ServerError: Decodable {
    var message: String
}

@MainActor
final class DiaryViewModel: ObservableObject {
    @Published var selectedDate = Date()
    @Published var staff: [Staff] = []
    @Published var services: [Service] = []
    @Published var bookings: [Booking] = []
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var errorMessage: String?
    @Published var draft: BookingDraft?

    private let api = APIClient()

    var selectedDateString: String {
        Self.dateFormatter.string(from: selectedDate)
    }

    var activeStaff: [Staff] {
        staff.filter(\.active).sorted { lhs, rhs in
            lhs.displayOrder == rhs.displayOrder ? lhs.name < rhs.name : lhs.displayOrder < rhs.displayOrder
        }
    }

    var activeServices: [Service] {
        services.filter(\.active).sorted { lhs, rhs in
            lhs.displayOrder == rhs.displayOrder ? lhs.name < rhs.name : lhs.displayOrder < rhs.displayOrder
        }
    }

    func loadAll() async {
        isLoading = true
        errorMessage = nil
        do {
            async let staff = api.getStaff()
            async let services = api.getServices()
            async let bookings = api.getBookings(date: selectedDateString)
            self.staff = try await staff
            self.services = try await services
            self.bookings = try await bookings
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func reloadBookings() async {
        do {
            bookings = try await api.getBookings(date: selectedDateString)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func changeDay(by days: Int) {
        selectedDate = Calendar.current.date(byAdding: .day, value: days, to: selectedDate) ?? selectedDate
        Task { await loadAll() }
    }

    func goToday() {
        selectedDate = Date()
        Task { await loadAll() }
    }

    func newDraft(staffId: String, startTime: String) {
        let service = activeServices.first
        draft = BookingDraft(
            customerName: "",
            serviceId: service?.id ?? "",
            staffId: staffId,
            date: selectedDateString,
            startTime: startTime,
            durationMinutes: service?.defaultDuration ?? 30,
            note: ""
        )
    }

    func editDraft(_ booking: Booking) {
        draft = BookingDraft(
            existingBookingId: booking.id,
            customerName: booking.customerName,
            serviceId: booking.serviceId,
            staffId: booking.staffId,
            date: booking.date,
            startTime: booking.startTime,
            durationMinutes: booking.durationMinutes,
            note: booking.note ?? ""
        )
    }

    func saveDraft(_ draft: BookingDraft) async -> Bool {
        let trimmedName = draft.customerName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty else {
            errorMessage = "Customer name is required"
            return false
        }
        guard !draft.serviceId.isEmpty, !draft.staffId.isEmpty else {
            errorMessage = "Service and staff are required"
            return false
        }

        isSaving = true
        errorMessage = nil
        let payload = BookingPayload(
            customerName: trimmedName,
            serviceId: draft.serviceId,
            staffId: draft.staffId,
            date: draft.date,
            startTime: draft.startTime,
            durationMinutes: draft.durationMinutes,
            note: draft.note
        )

        do {
            if let id = draft.existingBookingId {
                _ = try await api.updateBooking(id: id, payload: payload)
            } else {
                _ = try await api.createBooking(payload)
            }
            selectedDate = Self.dateFormatter.date(from: draft.date) ?? selectedDate
            await reloadBookings()
            isSaving = false
            self.draft = nil
            return true
        } catch {
            errorMessage = error.localizedDescription
            isSaving = false
            return false
        }
    }

    func deleteDraft(_ draft: BookingDraft) async -> Bool {
        guard let id = draft.existingBookingId else { return false }
        isSaving = true
        errorMessage = nil
        do {
            try await api.deleteBooking(id: id)
            await reloadBookings()
            isSaving = false
            self.draft = nil
            return true
        } catch {
            errorMessage = error.localizedDescription
            isSaving = false
            return false
        }
    }

    static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}

struct DiaryView: View {
    @StateObject private var viewModel = DiaryViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                header

                if let message = viewModel.errorMessage {
                    Text(message)
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                        .background(Color.red.opacity(0.08))
                }

                if viewModel.isLoading && viewModel.bookings.isEmpty {
                    ProgressView("Loading diary...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    DiaryGridView(viewModel: viewModel)
                }
            }
            .navigationTitle("Nail Schedule")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                await viewModel.loadAll()
            }
            .sheet(item: $viewModel.draft) { draft in
                BookingFormView(viewModel: viewModel, draft: draft)
            }
        }
    }

    private var header: some View {
        HStack(spacing: 10) {
            Button {
                viewModel.changeDay(by: -1)
            } label: {
                Image(systemName: "chevron.left")
                    .frame(width: 42, height: 42)
            }
            .buttonStyle(.bordered)

            Button("Today") {
                viewModel.goToday()
            }
            .buttonStyle(.bordered)

            Button {
                viewModel.changeDay(by: 1)
            } label: {
                Image(systemName: "chevron.right")
                    .frame(width: 42, height: 42)
            }
            .buttonStyle(.bordered)

            Spacer()

            DatePicker("", selection: $viewModel.selectedDate, displayedComponents: .date)
                .labelsHidden()
                .onChange(of: viewModel.selectedDate) {
                    Task { await viewModel.loadAll() }
                }
        }
        .padding()
        .background(.white)
        .overlay(alignment: .bottom) {
            Divider()
        }
    }
}

struct DiaryGridView: View {
    @ObservedObject var viewModel: DiaryViewModel

    private let slots = makeTimeSlots()
    private let staffColumnWidth: CGFloat = 154

    var body: some View {
        ScrollView([.horizontal, .vertical]) {
            HStack(alignment: .top, spacing: 0) {
                timeColumn

                ForEach(viewModel.activeStaff) { staff in
                    staffColumn(staff)
                }
            }
            .padding(.bottom, 24)
        }
        .background(Color(.systemGroupedBackground))
    }

    private var timeColumn: some View {
        VStack(spacing: 0) {
            Text("Time")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)
                .frame(width: 76, height: 46)
                .background(.white)
                .border(Color(.separator))

            ForEach(Array(slots.enumerated()), id: \.element) { index, slot in
                Text(slot)
                    .font(.caption2.weight(slot.hasSuffix(":00") ? .semibold : .regular))
                    .foregroundStyle(slot.hasSuffix(":00") ? .primary : .secondary)
                    .frame(width: 76, height: rowHeight, alignment: .topTrailing)
                    .padding(.top, 4)
                    .padding(.trailing, 8)
                    .background(slot.hasSuffix(":00") ? Color(.secondarySystemGroupedBackground) : .white)
                    .overlay(slotBorder(slot: slot, index: index))
            }
        }
    }

    private func staffColumn(_ staff: Staff) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                Circle()
                    .fill(Color(hex: staff.colour))
                    .frame(width: 10, height: 10)
                Text(staff.name)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
            }
            .frame(width: staffColumnWidth, height: 46)
            .background(.white)
            .border(Color(.separator))

            ZStack(alignment: .topLeading) {
                VStack(spacing: 0) {
                    ForEach(Array(slots.enumerated()), id: \.element) { index, slot in
                        Button {
                            viewModel.newDraft(staffId: staff.id, startTime: slot)
                        } label: {
                            Rectangle()
                                .fill(Color.clear)
                                .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .frame(width: staffColumnWidth, height: rowHeight)
                        .background(Color.white)
                        .overlay(slotBorder(slot: slot, index: index))
                    }
                }

                ForEach(bookings(for: staff)) { booking in
                    BookingBlockView(
                        booking: booking,
                        service: service(for: booking),
                        width: staffColumnWidth - 8
                    ) {
                        viewModel.editDraft(booking)
                    }
                    .offset(x: 4, y: bookingTop(booking.startTime) + 2)
                }
            }
            .frame(width: staffColumnWidth, height: CGFloat(slots.count) * rowHeight, alignment: .topLeading)
        }
    }

    private func slotBorder(slot: String, index: Int) -> some View {
        let startsHour = slot.hasSuffix(":00")
        let endsHour = slot.hasSuffix(":45")
        let isLast = index == slots.count - 1

        return VStack(spacing: 0) {
            Rectangle()
                .fill(startsHour ? Color(.separator) : Color.clear)
                .frame(height: startsHour ? 2 : 0)
            Spacer()
            Rectangle()
                .fill((endsHour || isLast) ? Color(.separator) : Color(.quaternaryLabel))
                .frame(height: (endsHour || isLast) ? 2 : 1)
        }
    }

    private func bookings(for staff: Staff) -> [Booking] {
        viewModel.bookings.filter { $0.staffId == staff.id }
    }

    private func service(for booking: Booking) -> Service? {
        viewModel.services.first { $0.id == booking.serviceId }
    }
}

struct BookingBlockView: View {
    var booking: Booking
    var service: Service?
    var width: CGFloat
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 2) {
                Text(booking.customerName)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.black)
                    .lineLimit(1)

                if booking.durationMinutes > 30 {
                    Text(service?.name ?? "Service")
                        .font(.caption2)
                        .foregroundStyle(.black.opacity(0.75))
                        .lineLimit(1)
                    Text("\(booking.startTime)-\(endTime(booking.startTime, booking.durationMinutes))")
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(.black.opacity(0.65))
                        .lineLimit(1)
                }
            }
            .frame(width: width - 12, height: max(bookingHeight(booking.durationMinutes) - 8, 32), alignment: .topLeading)
            .padding(6)
            .background(Color(hex: service?.colour ?? "#e5e7eb"))
            .clipShape(RoundedRectangle(cornerRadius: 7))
            .overlay {
                RoundedRectangle(cornerRadius: 7)
                    .stroke(Color.black.opacity(0.12), lineWidth: 1)
            }
            .shadow(color: .black.opacity(0.08), radius: 2, x: 0, y: 1)
        }
        .buttonStyle(.plain)
    }
}

struct BookingFormView: View {
    @ObservedObject var viewModel: DiaryViewModel
    @State private var draft: BookingDraft
    @Environment(\.dismiss) private var dismiss
    @State private var confirmDelete = false

    init(viewModel: DiaryViewModel, draft: BookingDraft) {
        self.viewModel = viewModel
        _draft = State(initialValue: draft)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text(summaryText)
                        .font(.headline)
                    if let service = selectedService {
                        Text(service.name)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("Booking") {
                    TextField("Customer name", text: $draft.customerName)

                    Picker("Service", selection: $draft.serviceId) {
                        ForEach(viewModel.activeServices) { service in
                            Text("\(service.name) · \(service.defaultDuration) min")
                                .tag(service.id)
                        }
                    }
                    .onChange(of: draft.serviceId) {
                        if let service = selectedService {
                            draft.durationMinutes = service.defaultDuration
                        }
                    }

                    Picker("Duration", selection: $draft.durationMinutes) {
                        ForEach(durationOptions, id: \.self) { duration in
                            Text("\(duration) minutes").tag(duration)
                        }
                    }

                    TextField("Optional note", text: $draft.note, axis: .vertical)
                }

                if draft.isEditing {
                    Section("Change schedule") {
                        Picker("Employee", selection: $draft.staffId) {
                            ForEach(viewModel.activeStaff) { staff in
                                Text(staff.name).tag(staff.id)
                            }
                        }

                        TextField("Date", text: $draft.date)
                            .keyboardType(.numbersAndPunctuation)

                        Picker("Start time", selection: $draft.startTime) {
                            ForEach(makeTimeSlots(), id: \.self) { slot in
                                Text(slot).tag(slot)
                            }
                        }
                    }
                }

                if viewModel.isSaving {
                    ProgressView("Saving...")
                }
            }
            .navigationTitle(draft.isEditing ? "Edit booking" : "New booking")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                if draft.isEditing {
                    ToolbarItem(placement: .bottomBar) {
                        Button(role: .destructive) {
                            confirmDelete = true
                        } label: {
                            Text("Delete booking")
                        }
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button(draft.isEditing ? "Save" : "Create") {
                        Task {
                            if await viewModel.saveDraft(draft) {
                                dismiss()
                            }
                        }
                    }
                    .disabled(viewModel.isSaving || draft.customerName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .confirmationDialog("Delete this booking?", isPresented: $confirmDelete, titleVisibility: .visible) {
                Button("Delete booking", role: .destructive) {
                    Task {
                        if await viewModel.deleteDraft(draft) {
                            dismiss()
                        }
                    }
                }
                Button("Cancel", role: .cancel) {}
            }
        }
    }

    private var selectedStaff: Staff? {
        viewModel.staff.first { $0.id == draft.staffId }
    }

    private var selectedService: Service? {
        viewModel.services.first { $0.id == draft.serviceId }
    }

    private var summaryText: String {
        "\(selectedStaff?.name ?? "Staff") · \(draft.date) · \(draft.startTime)-\(endTime(draft.startTime, draft.durationMinutes))"
    }
}

private func makeTimeSlots() -> [String] {
    stride(from: dayStartMinutes, through: dayEndMinutes, by: slotMinutes).map(minutesToTime)
}

private func minutesToTime(_ totalMinutes: Int) -> String {
    let hours = totalMinutes / 60
    let minutes = totalMinutes % 60
    return String(format: "%02d:%02d", hours, minutes)
}

private func timeToMinutes(_ time: String) -> Int {
    let parts = time.split(separator: ":").compactMap { Int($0) }
    guard parts.count == 2 else { return dayStartMinutes }
    return parts[0] * 60 + parts[1]
}

private func endTime(_ startTime: String, _ durationMinutes: Int) -> String {
    minutesToTime(timeToMinutes(startTime) + durationMinutes)
}

private func bookingTop(_ startTime: String) -> CGFloat {
    CGFloat(timeToMinutes(startTime) - dayStartMinutes) / CGFloat(slotMinutes) * rowHeight
}

private func bookingHeight(_ durationMinutes: Int) -> CGFloat {
    CGFloat(durationMinutes) / CGFloat(slotMinutes) * rowHeight
}

extension Color {
    init(hex: String) {
        let cleaned = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var value: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&value)
        let red = Double((value >> 16) & 0xff) / 255
        let green = Double((value >> 8) & 0xff) / 255
        let blue = Double(value & 0xff) / 255
        self.init(red: red, green: green, blue: blue)
    }
}
