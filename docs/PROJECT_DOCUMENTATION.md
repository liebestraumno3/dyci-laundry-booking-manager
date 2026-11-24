# WashOps — Laundry Booking Manager
## Angular Finals Group Project Documentation

---

## 1. Cover Page

| Field | Details |
|---|---|
| **Project Title** | WashOps — Laundry Booking Manager |
| **Assigned Scenario** | Group 6: Laundry Booking Manager |
| **Explored Angular Feature** | Custom Validators in Angular Reactive Forms (Weight Limits & Booking Date Validation) |
| **Group Number** | Group 6 |
| **Group Members** | Member 1: *[Insert Name]* — Project Coordination, Component Structure & Integration<br>Member 2: *[Insert Name]* — Interface, Forms, Data Binding & Styling<br>Member 3: *[Insert Name]* — Services, API Integration & Data Persistence<br>Member 4: *[Insert Name]* — Testing, Documentation Coordination & Verification |
| **Subject / Course** | Web Development / Angular Framework Finals |
| **Submission Date** | November 24, 2026 |
| **Technology Stack** | Angular 22 (Standalone Components, Modern Control Flow, Reactive Forms), RxJS 7.8, TypeScript 6, `json-server` Local REST API |

---

## 2. Project Overview

### 2.1 Problem Statement
Small and medium-sized neighborhood laundry shops commonly track customer drop-offs using paper logbooks or disconnected spreadsheets. This manual workflow leads to four recurring operational failures:
1. **Machine Overloading:** Staff accept laundry loads that exceed the physical drum capacity of specific machines (for example, loading 11 kg into an 8 kg dry-cleaning solvent unit), causing equipment damage and unwashed garments.
2. **Scheduling Errors:** Invalid or past drop-off dates are accidentally recorded, creating confusion in pickup queues and express turnaround commitments.
3. **Billing Inconsistencies:** Manual multiplication of weight by service tier rates—plus express rush surcharges—frequently produces arithmetic errors at the counter.
4. **Slow Order Lookup:** Locating a customer's laundry status during pickup requires scanning dozens of handwritten rows.

### 2.2 Intended Users
- **Front-Desk Counter Staff:** Record new customer bookings, verify acceptable drum weights and drop-off dates, quote exact charges on the spot, and search orders during customer pickup.
- **Laundry Machine Operators / Supervisors:** Monitor pending and active wash loads, check per-service weight volumes, and advance order stages (`Pending → Washing → Ready → Completed`).

### 2.3 Objectives
1. Build a responsive, high-density Angular 22 web application organized into four modular standalone components (`NavbarComponent`, `DashboardComponent`, `BookingListComponent`, and `BookingFormComponent`).
2. Automatically compute base charges, express surcharges, and total fees from the selected service tier, load weight, and express rush toggle.
3. Implement and thoroughly demonstrate **Custom Validators** in Angular Reactive Forms to enforce physical machine weight limits (both hard shop limits and per-service drum limits) and prevent past or out-of-window booking dates.
4. Persist all bookings to a writable local REST API (`json-server` backed by `db.json`) with full CRUD operations (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), instant search/filtering, and resilient error handling.

### 2.4 Scope
- Full booking lifecycle management (Create, Read, Update, Quick Status Advance, Delete).
- Four service tiers with distinct per-kilogram pricing and drum weight caps:
  - **Wash & Fold:** ₱45/kg (Max 15 kg — Standard Drum)
  - **Wash & Iron:** ₱65/kg (Max 12 kg — Care & Press Drum)
  - **Dry Cleaning:** ₱120/kg (Max 8 kg — Solvent Unit)
  - **Comforter & Bulky:** ₱85/kg (Max 20 kg — Heavy-Duty Extractor)
- Express 4-hour rush option (+₱100.00 flat surcharge).
- Real-time search (by customer name, booking ID, contact number, or notes) and multi-filter controls (status, service type, express-only).
- Operations overview dashboard with KPI counters, recent bookings table, and service-tier load summary.
- Custom Reactive Forms validators with live validator status monitoring and inline field errors.

### 2.5 Limitations
- Uses a local `json-server` mock REST API writing to `db.json` rather than a multi-user cloud database; concurrent writes from multiple workstations are not supported.
- No user authentication, role-based access control, or online payment gateway integration.
- Currency is standardized to Philippine Peso (`PHP` / `₱`) and booking dates follow the browser's local calendar timezone.

---

## 3. Interface Plan

### 3.1 Design System & Visual Direction
WashOps uses a utilitarian, high-density dark-mode interface inspired by **Linear** and **Raycast**:
- **Surface Hierarchy:** Deep neutral zinc/slate surfaces (`#09090b` canvas, `#111114` primary panels, `#16161a` recessed headers) separated by crisp `1px` borders (`#23232a` / `#363642`).
- **Single Brand Accent:** Crisp blue (`#3b82f6`, hover `#2563eb`) reserved for primary actions, active capacity bars, and keyboard focus rings.
- **Restraint:** Zero glassmorphism (`backdrop-filter`), zero neon drop shadows, zero gradient text, and zero badge clutter. Booking statuses use minimal 7 px semantic dots paired with clean labels.
- **Typography:** `Inter` for labels and headings; `JetBrains Mono` with tabular figures (`tabular-nums`) for booking IDs, weights, dates, and currency amounts for strict vertical alignment in tables.
- **4-State Resilience:** Every asynchronous view handles Loading (shape-matched skeleton loaders), Empty (purposeful CTA), Error (actionable banner with Retry button), and Interactive/Disabled submission states.

### 3.2 Initial Interface Wireframes

#### Navigation Bar & Overview Dashboard
```text
+------------------------------------------------------------------------------+
| [W] WashOps  |  [Overview]  [Bookings 5]  [Booking Form]   (● API :3000) [+New]|
+------------------------------------------------------------------------------+
| Operations Overview                               [Manage All] [+ Create]    |
| +---------------+ +---------------+ +---------------+ +--------------------+ |
| | Active Queue  | | Ready Pickup  | | Total Load    | | Calculated Revenue | |
| | 3             | | 1             | | 36.0 kg       | | ₱2,722.50          | |
| +---------------+ +---------------+ +---------------+ +--------------------+ |
| +-----------------------------------------+ +------------------------------+ |
| | Scheduled Bookings (Recent 5)           | | Service Tiers & Limits       | |
| | ID | Customer | Service | Load | Status | | Wash & Fold    ₱45/kg 15 kg  | |
| | ...                                     | | Wash & Iron    ₱65/kg 12 kg  | |
| |                                         | | Dry Cleaning  ₱120/kg  8 kg  | |
| |                                         | | Comforter      ₱85/kg 20 kg  | |
| +-----------------------------------------+ +------------------------------+ |
+------------------------------------------------------------------------------+
```

#### Bookings Directory (Search, Filter & Inline Actions)
```text
+------------------------------------------------------------------------------+
| [ Search name, ID, phone... ] [Status v] [Service v] [ ] Express only [Reset]|
+------------------------------------------------------------------------------+
| ID      | Customer        | Service     | Weight | Date       | Status | Act |
| BK-1001 | Elena Navarro   | Wash & Fold | 6.5 kg | 2026-11-24 | ● Wash | ... |
| BK-1002 | Marcus Villan.. | Wash & Iron | 4.0 kg | 2026-11-24 | ● Pend | ... |
+------------------------------------------------------------------------------+
| Showing 5 of 5 bookings                      Load: 36.0 kg · Subtotal: ₱2722 |
+------------------------------------------------------------------------------+
```

#### Booking Form + Live Charge & Custom Validator Rail
```text
+--------------------------------------------+ +-------------------------------+
| Customer Name*        | Contact Number*    | | Calculated Charges            |
| Service Type*         | Load Weight (kg)*  | | Rate: ₱120/kg  Weight: 10 kg  |
|   [Inline custom validator error message]  | | Express: ₱0.00  Total: ₱1,200 |
| Drop-Off Date*        | Workflow Status    | +-------------------------------+
|   [Inline past-date error message]         | | Drum Capacity Guard           |
| [x] Express 4-Hour Rush (+₱100.00)         | | 10.0 / 8 kg  [██████████] RED |
| Special Care Notes                         | +-------------------------------+
| [Reset]                [Cancel] [Create]   | | Custom Validators Monitor     |
+--------------------------------------------+ | weightLimitValidator     PASS |
                                               | serviceWeightCapacity  BLOCKED|
                                               | noPastDateValidator      PASS |
                                               | contactNumberValidator   PASS |
                                               +-------------------------------+
```

### 3.3 Final Screenshots Checklist (Attach When Exporting to PDF)
- *[Screenshot 1]* Operations Overview Dashboard showing KPI cards, recent bookings, and service drum limits.
- *[Screenshot 2]* Bookings Directory filtered by search query and status with inline quick-advance actions.
- *[Screenshot 3]* Booking Form triggering `serviceWeightCapacityValidator` (red Drum Capacity Guard + inline error) and `noPastDateValidator` (past date blocked).
- *[Screenshot 4]* API Offline Error Banner with "Retry Connection" button when `json-server` is stopped.

---

## 4. Application Structure

### 4.1 Directory & File Layout
```text
LaundryBookingManager/
├── db.json                                       # Persistent JSON database (5 seed records)
├── package.json                                  # Scripts (start, api, build, test)
├── docs/
│   └── PROJECT_DOCUMENTATION.md                  # Source documentation for PDF export
└── src/
    ├── index.html                                # Document shell & font imports
    ├── styles.css                                # Global dark-mode tokens & shared UI primitives
    └── app/
        ├── app.config.ts                         # Application providers (HttpClient + Fetch)
        ├── app.ts / app.html / app.css           # Root coordinator shell & API state orchestration
        ├── app.spec.ts                           # Root component initialization unit test
        ├── models/
        │   └── booking.model.ts                  # Interfaces, service catalog, charge calculator
        ├── validators/
        │   ├── booking.validators.ts             # Custom Reactive Forms validators (Explored Feature)
        │   └── booking.validators.spec.ts        # Unit test suite for all custom validators
        ├── services/
        │   ├── booking.service.ts                # Injectable HTTP service for /bookings CRUD
        │   └── booking.service.spec.ts           # HttpTestingController unit tests for CRUD & errors
        └── components/
            ├── navbar/
            │   └── navbar.component.{ts,html,css}
            ├── dashboard/
            │   └── dashboard.component.{ts,html,css}
            ├── booking-list/
            │   └── booking-list.component.{ts,html,css}
            └── booking-form/
                └── booking-form.component.{ts,html,css}
```

### 4.2 Component, Service & Module Responsibilities

| File Path | Symbol | Responsibility |
|---|---|---|
| `src/app/app.ts` | `App` | Root standalone component. Injects `BookingService`, subscribes to CRUD Observables, manages active view (`dashboard`, `bookings`, `form`), holds loaded bookings, and renders global API error & success banners. |
| `src/app/components/navbar/navbar.component.ts` | `NavbarComponent` | Persistent top navigation bar displaying brand identity, view tabs with live booking count, API connectivity status indicator, Sync trigger, and primary `+ New Booking` CTA. |
| `src/app/components/dashboard/dashboard.component.ts` | `DashboardComponent` | Computes operational KPIs (Active Queue, Ready for Pickup, Total Load Weight, Calculated Revenue), displays the 5 most recent scheduled bookings, and summarizes each service tier's machine capacity and load volume. |
| `src/app/components/booking-list/booking-list.component.ts` | `BookingListComponent` | Full booking register with two-way bound search and multi-criteria filtering (status, service type, express-only), inline workflow stage progression, edit trigger, and inline per-row delete confirmation. |
| `src/app/components/booking-form/booking-form.component.ts` | `BookingFormComponent` | Reactive Forms create/edit interface applying all custom validators, live charge breakdown calculation via `valueChanges.subscribe()`, Drum Capacity Guard meter, and live Custom Validators Monitor. |
| `src/app/services/booking.service.ts` | `BookingService` | Injectable root service encapsulating all HTTP requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) to `http://localhost:3000/bookings` and translating `HttpErrorResponse` codes into actionable user messages. |
| `src/app/validators/booking.validators.ts` | `weightLimitValidator`, `serviceWeightCapacityValidator`, `noPastDateValidator`, `contactNumberValidator` | Custom Angular Reactive Forms validators enforcing physical weight bounds, per-service machine drum capacities, local-date non-past/advance-window validation, and phone number formatting. |
| `src/app/models/booking.model.ts` | `Booking`, `SERVICE_CATALOG`, `calculateBookingCharges`, `formatLocalDateISO` | Strongly typed domain interfaces, single source of truth for pricing and drum limits, pure charge calculator, and local-timezone ISO date formatter. |
| `db.json` | Mock Database | Local `json-server` data store pre-populated with 5 realistic laundry booking records (`BK-1001` to `BK-1005`). |

---

## 5. Topic Mapping

| Course Topic | Where Applied (Actual File) | How It Was Implemented |
|---|---|---|
| **Standalone Components** | `navbar.component.ts`, `dashboard.component.ts`, `booking-list.component.ts`, `booking-form.component.ts`, `app.ts` | Every component declares `standalone: true` and explicitly imports only what it requires (`FormsModule`, `ReactiveFormsModule`, `CurrencyPipe`, `DecimalPipe`). |
| **Interpolation (`{{ }}`)** | All 4 component HTML templates | Displays dynamic KPIs (`{{ stats().totalWeightKg }}`), customer data (`{{ booking.customerName }}`), calculated totals (`{{ chargeBreakdown().totalCharge \| currency }}`), and detailed custom validator parameters (`{{ controls.bookingDate.errors?.['pastDate']?.minDate }}`). |
| **Property Binding (`[...]`)** | `app.html`, `navbar.component.html`, `booking-form.component.html`, `booking-list.component.html` | Passes data into child inputs (`[bookings]="bookings()"`, `[editingBooking]="editingBooking()"`), toggles disabled states (`[disabled]="isSubmitting()"`), binds invalid input styling (`[class.input--invalid]`), ARIA attributes (`[attr.aria-invalid]`), and dynamic capacity bar width (`[style.width.%]="capacityPercent()"`). |
| **Event Binding (`(...)`)** | All component HTML templates | Handles clicks (`(click)="onNavigate('bookings')"`), form submission (`(ngSubmit)="onSubmit()"`), and child-to-parent custom outputs (`(submitBooking)`, `(editBooking)`, `(deleteBooking)`, `(statusChange)`). |
| **Two-Way Binding (`[(ngModel)]`)** | `src/app/components/booking-list/booking-list.component.html` | Binds the search box (`[(ngModel)]="searchQuery"`), status dropdown (`[(ngModel)]="statusFilter"`), service filter (`[(ngModel)]="serviceFilter"`), and express-only checkbox (`[(ngModel)]="expressOnly"`) to reactive signals that instantaneously filter the table. |
| **Control Flow: `@if` / `@else if` / `@else`** | `app.html`, `dashboard.component.html`, `booking-list.component.html`, `booking-form.component.html`, `navbar.component.html` | Renders loading skeletons, empty states, filtered-empty states, API error/success banners, inline delete confirmations, and specific inline validation error messages. |
| **Control Flow: `@for (...; track ...)`** | `dashboard.component.html`, `booking-list.component.html`, `booking-form.component.html` | Iterates over booking records (`track booking.id`), service catalog options (`track service.type`), status options (`track status`), and skeleton placeholder rows (`track row`). |
| **Control Flow: `@switch` / `@case`** | `app.html`, `dashboard.component.html`, `booking-list.component.html` | Switches the active page view (`dashboard` / `bookings` / `form`), renders semantic status dots per workflow state, and chooses the appropriate next-stage action button (`Start Wash`, `Mark Ready`, `Complete`, or `Closed`). |
| **Services & Dependency Injection** | `src/app/services/booking.service.ts`, `src/app/app.ts`, `src/app/app.config.ts` | `BookingService` uses `@Injectable({ providedIn: 'root' })`, injects `HttpClient` via `inject(HttpClient)`, and is injected into `App` via `inject(BookingService)`. `provideHttpClient(withFetch())` is registered in `appConfig`. |
| **HTTP Integration & Persistence** | `src/app/services/booking.service.ts`, `db.json` | Executes `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` requests against `http://localhost:3000/bookings`. Mutations are written directly to `db.json` by `json-server`, surviving full page reloads. |
| **RxJS Observables & `subscribe()`** | `src/app/app.ts`, `src/app/components/booking-form/booking-form.component.ts`, `src/app/services/booking.service.ts` | Every API method returns an `Observable<T>` piped through `catchError()`. `App` handles responses via `.subscribe({ next, error })`, and `BookingFormComponent` subscribes to `bookingForm.valueChanges` (with `takeUntilDestroyed`) for real-time charge recalculation and validator monitoring. |
| **Custom Validators (Explored Feature)** | `src/app/validators/booking.validators.ts`, `src/app/components/booking-form/booking-form.component.ts` | Combines control-level validator factories (`weightLimitValidator`, `noPastDateValidator`, `contactNumberValidator`) with a cross-field group validator (`serviceWeightCapacityValidator`). |

---

## 6. API Documentation

### 6.1 Base Configuration
- **Mock API Engine:** `json-server` v1.x
- **Data File:** `db.json` (project root)
- **Base Endpoint:** `http://localhost:3000/bookings`
- **Content-Type:** `application/json`

### 6.2 Booking Resource Schema

| Field | Type | Required | Description & Constraints |
|---|---|---|---|
| `id` | `string` | Auto / Key | Unique booking identifier (e.g., `"BK-1001"` or server-generated ID on `POST`). |
| `customerName` | `string` | Yes | Customer full name (2–80 characters). |
| `contactNumber` | `string` | Yes | Customer mobile/landline number (10–13 numeric digits via `contactNumberValidator`). |
| `serviceType` | `string` | Yes | One of `"Wash & Fold"`, `"Wash & Iron"`, `"Dry Cleaning"`, `"Comforter & Bulky"`. |
| `weightKg` | `number` | Yes | Load weight in kilograms (`0.5`–`20.0`, further capped by `serviceType` drum limit). |
| `isExpress` | `boolean` | Yes | `true` for 4-hour priority rush (+₱100 flat surcharge), `false` for standard turnaround. |
| `bookingDate` | `string` | Yes | Scheduled drop-off date in `YYYY-MM-DD` format (today up to 30 days ahead; no past dates). |
| `status` | `string` | Yes | Workflow stage: `"Pending"`, `"Washing"`, `"Ready"`, or `"Completed"`. |
| `baseCharge` | `number` | Calculated | `weightKg × ratePerKg` rounded to 2 decimal places. |
| `expressFee` | `number` | Calculated | `100` if `isExpress` is `true`, otherwise `0`. |
| `totalCharge` | `number` | Calculated | `baseCharge + expressFee`. |
| `notes` | `string` | No | Special garment care instructions (max 240 characters). |
| `createdAt` | `string` | Auto | ISO-8601 creation timestamp. |

### 6.3 Endpoints Summary

| HTTP Method | Endpoint | Purpose | Success Status |
|---|---|---|---|
| `GET` | `/bookings` | Retrieve all persisted laundry bookings | `200 OK` |
| `GET` | `/bookings/:id` | Retrieve a single booking by ID | `200 OK` |
| `POST` | `/bookings` | Create and persist a new laundry booking | `201 Created` |
| `PUT` | `/bookings/:id` | Replace/update all fields of an existing booking | `200 OK` |
| `PATCH` | `/bookings/:id` | Partially update a booking (used for quick status advance) | `200 OK` |
| `DELETE` | `/bookings/:id` | Permanently delete a booking from `db.json` | `200 OK` |

### 6.4 Sample Requests & Responses

#### 1. Retrieve All Bookings (`GET /bookings`)
**Response (`200 OK`):**
```json
[
  {
    "id": "BK-1001",
    "customerName": "Elena Navarro",
    "contactNumber": "0917-482-3190",
    "serviceType": "Wash & Fold",
    "weightKg": 6.5,
    "isExpress": false,
    "bookingDate": "2026-11-24",
    "status": "Washing",
    "baseCharge": 292.5,
    "expressFee": 0,
    "totalCharge": 292.5,
    "notes": "Separate whites and darks; hypoallergenic detergent.",
    "createdAt": "2026-11-24T08:15:00.000Z"
  }
]
```

#### 2. Create New Booking (`POST /bookings`)
**Request Body:**
```json
{
  "customerName": "Paolo Reyes",
  "contactNumber": "0917-223-9901",
  "serviceType": "Wash & Iron",
  "weightKg": 5,
  "isExpress": true,
  "bookingDate": "2026-11-27",
  "status": "Pending",
  "baseCharge": 325,
  "expressFee": 100,
  "totalCharge": 425,
  "notes": "Fold trousers neatly.",
  "createdAt": "2026-11-24T10:30:00.000Z"
}
```
**Response (`201 Created`):**
```json
{
  "id": "a4c9",
  "customerName": "Paolo Reyes",
  "contactNumber": "0917-223-9901",
  "serviceType": "Wash & Iron",
  "weightKg": 5,
  "isExpress": true,
  "bookingDate": "2026-11-27",
  "status": "Pending",
  "baseCharge": 325,
  "expressFee": 100,
  "totalCharge": 425,
  "notes": "Fold trousers neatly.",
  "createdAt": "2026-11-24T10:30:00.000Z"
}
```

#### 3. Quick Status Update (`PATCH /bookings/BK-1002`)
**Request Body:**
```json
{
  "status": "Washing"
}
```
**Response (`200 OK`):** Returns the updated booking object with `"status": "Washing"`.

#### 4. Delete Booking (`DELETE /bookings/BK-1005`)
**Response (`200 OK`):** Removes `BK-1005` from `db.json` and returns the deleted record (or empty body).

#### 5. Error Response (Server Unreachable — `status: 0`)
When `json-server` is stopped, `BookingService.handleError()` catches `HttpErrorResponse` with `status === 0` and emits:
> `Unable to load bookings. The local API server (http://localhost:3000) is unreachable. Start json-server and retry.`

---

## 7. Exploration Report: Custom Validators in Angular Reactive Forms

### 7.1 What Feature Did We Explore?
We explored **Custom Validators in Angular Reactive Forms**, implementing both:
1. **Parameterized Control-Level Validator Factories (`ValidatorFn`):**
   - `weightLimitValidator(maxKg, minKg)` — guards against non-numeric weights, loads below the 0.5 kg minimum, and loads exceeding the 20 kg absolute shop drum limit.
   - `noPastDateValidator(maxAdvanceDays, todayProvider)` — rejects malformed or non-existent calendar dates (e.g., `2026-02-30`), blocks past booking dates relative to local today, and enforces a 30-day advance booking window.
   - `contactNumberValidator()` — enforces 10–13 digits while permitting natural phone formatting characters (`+`, `-`, spaces, parentheses).
2. **Cross-Field FormGroup Validator:**
   - `serviceWeightCapacityValidator(group)` — reads `serviceType` and `weightKg` together and validates the load against the specific machine drum limit assigned to that service (`Dry Cleaning`: 8 kg, `Wash & Iron`: 12 kg, `Wash & Fold`: 15 kg, `Comforter & Bulky`: 20 kg).

### 7.2 Why Is It Useful in Our Application?
Built-in Angular validators (`Validators.required`, `Validators.min`, `Validators.max`) only evaluate static, isolated field rules. A laundry booking counter needs domain-aware rules:
- **Dynamic Machine Safety:** A 10 kg load is perfectly safe for `Wash & Fold` (15 kg drum) but hazardous for `Dry Cleaning` (8 kg solvent unit). A cross-field custom validator immediately flags the mismatch when either the weight or the service dropdown changes.
- **Reliable Calendar Rules:** HTML `<input type="date">` accepts past dates via typing or browser quirks, and `Validators.min` cannot compare calendar date strings. A custom date validator ensures invalid schedules are blocked at the form model level with rich metadata (`selectedDate`, `minDate`, `maxDate`) so the UI can tell the cashier *why* the input failed.

### 7.3 Sources Consulted
1. Angular Official Documentation — *Validating form input (Reactive Forms & Custom Validators)*: `https://angular.dev/guide/forms/form-validation`
2. Angular API Reference — `ValidatorFn`, `AbstractControl`, `ValidationErrors`: `https://angular.dev/api/forms/ValidatorFn`
3. MDN Web Docs — `Date()` Constructor & ISO-8601 Date-Only String UTC Parsing Pitfalls: `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date`

### 7.4 Experiment Performed
Before wiring validators into `BookingFormComponent`, we built an isolated Vitest experiment (`src/app/validators/booking.validators.spec.ts`) using standalone `FormControl` and `FormGroup` instances:
1. Tested `weightLimitValidator(20, 0.5)` against empty input (`null` / `""`), below-minimum (`0.2`), exact boundaries (`0.5`, `20`), and overload (`22.5`).
2. Tested `serviceWeightCapacityValidator` on a `FormGroup({ serviceType, weightKg })` by setting `Dry Cleaning` + `10 kg` (expecting `machineCapacityExceeded`) and then switching to `Comforter & Bulky` + `18 kg` (expecting `null`).
3. Tested `noPastDateValidator(30, fixedToday)` with an injected `todayProvider` returning local `2026-11-24`, verifying yesterday (`2026-11-23`), today (`2026-11-24`), +30 days (`2026-12-24`), +47 days (`2027-01-10`), and impossible dates (`2026-02-30`).

### 7.5 Problems Encountered & How We Resolved Them

| # | Problem Encountered | Root Cause | Resolution |
|---|---|---|---|
| 1 | **Timezone Off-by-One Bug on "Today's Date"** | Passing `"2026-11-24"` directly to `new Date("2026-11-24")` parses it as UTC midnight (`00:00Z`), which shifts to the previous or next day when compared against local `new Date()` depending on timezone offset. | Parsed `YYYY-MM-DD` via a strict regex and instantiated local midnight with `new Date(year, month - 1, day)`, then verified no calendar rollover occurred (also catching impossible dates like `2026-02-30`). |
| 2 | **Static Weight Limits Failed When Switching Service Types** | Attaching a single `Validators.max(15)` to `weightKg` did not adapt when the user switched `serviceType` to `Dry Cleaning` (max 8 kg) or `Comforter & Bulky` (max 20 kg). | Kept `weightLimitValidator(20, 0.5)` on `weightKg` for absolute shop limits and added `serviceWeightCapacityValidator` at the `FormGroup` level so Angular automatically re-validates on either field change. |
| 3 | **TypeScript Strict Compilation Error (`TS4111`)** | Angular 22 enables `noPropertyAccessFromIndexSignature: true`; accessing `control.errors?.weightExceeded` failed to compile because `ValidationErrors` uses an index signature. | Switched all error property lookups in templates and TypeScript to bracket notation (`control.errors?.['weightExceeded']?.max`). |
| 4 | **Derived Charge & Validator Monitor Sync in Zoneless Angular 22** | Angular 22 runs zoneless by default; mutating plain class properties inside `valueChanges.subscribe()` did not reliably trigger template refreshes. | Stored `chargeBreakdown`, `activeServiceConfig`, and `validatorSnapshot` in Angular `signal()`s updated inside `bookingForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...)`. |

### 7.6 How the Final Implementation Works
1. `BookingFormComponent` defines `bookingForm` using `FormBuilder.nonNullable.group(...)`, attaching `weightLimitValidator`, `noPastDateValidator`, and `contactNumberValidator` to their respective `FormControl`s, and `serviceWeightCapacityValidator` to the `FormGroup`.
2. On every keystroke or dropdown change, Angular runs the synchronous validator pipeline and emits on `bookingForm.valueChanges`.
3. Each custom validator returns either `null` (valid) or a structured error object containing contextual metadata (e.g., `{ pastDate: { selectedDate: '2026-11-20', minDate: '2026-11-24' } }` or `{ machineCapacityExceeded: { actual: 10, max: 8, serviceType: 'Dry Cleaning', machineLabel: 'Solvent Unit (Max 8 kg)' } }`).
4. The template displays exact inline error messages below each invalid control, turns the **Drum Capacity Guard** bar red when overloaded, updates the live **Custom Validators Monitor** (`PASS` / `BLOCKED`), and prevents `onSubmit()` from sending invalid payloads to `BookingService`.

---

## 8. Testing Results

All automated unit tests (`npx ng test --watch=false`) and manual end-to-end verification tests against `json-server` passed cleanly.

| ID | Category | Test Case Description | Input / Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| **TC-01** | Normal Action (Read) | Load seeded bookings on startup | Start `npm run api` and `npm start`; open app at `http://localhost:4200`. | `GET /bookings` returns 5 bookings (`BK-1001`–`BK-1005`); Overview displays Active Queue = 3, Ready = 1, Total Load = `36.0 kg`, Revenue = `₱2,722.50`. | All 5 records loaded; KPI cards and recent table matched exact totals. | **PASS** |
| **TC-02** | Normal Action (Create) | Create standard Wash & Fold booking | Open `+ New Booking`; enter `Paolo Reyes`, `0917-223-9901`, `Wash & Fold`, `6` kg, Express unchecked, date `2026-11-27`; submit. | Calculated Total shows `₱270.00`; `POST /bookings` succeeds (`201`); redirects to Bookings with success banner. | Record created and persisted in `db.json` with `totalCharge: 270`. | **PASS** |
| **TC-03** | Normal Action (Pricing) | Create Express Wash & Iron booking | Enter `Lara Aquino`, `0918-445-6102`, `Wash & Iron`, `5` kg, check Express (`+₱100`), date `2026-11-28`; submit. | Base = `₱325.00`, Express = `₱100.00`, Total = `₱425.00`; row shows `EXPRESS +₱100`. | Exact breakdown computed live and saved to API. | **PASS** |
| **TC-04** | Custom Validator (Weight Min) | Block load below minimum weight | Enter `0.2` kg in Load Weight field and blur/submit. | `weightLimitValidator` returns `weightTooLow`; inline error shows minimum `0.5 kg`; submission blocked; Monitor shows `BLOCKED`. | Error displayed immediately; form submission prevented. | **PASS** |
| **TC-05** | Custom Validator (Weight Max) | Block load above absolute shop drum limit | Select `Comforter & Bulky`, enter `25` kg. | `weightLimitValidator` returns `weightExceeded`; inline error cites `20 kg` hard limit; Capacity Guard turns red; submission blocked. | Hard limit error displayed and submission blocked. | **PASS** |
| **TC-06** | Custom Validator (Cross-Field) | Block load exceeding selected service drum capacity | Select `Dry Cleaning` (Max `8 kg`), enter `10` kg; then switch service to `Wash & Fold` (Max `15 kg`). | On `Dry Cleaning`, `serviceWeightCapacityValidator` blocks form with `machineCapacityExceeded` (`10 kg > 8 kg`). Switching to `Wash & Fold` clears the error to `PASS`. | Error triggered dynamically and cleared immediately upon switching service. | **PASS** |
| **TC-07** | Custom Validator (Past Date) | Prevent past booking dates | Select yesterday (`2026-11-23`) in Drop-Off Date field. | `noPastDateValidator` returns `pastDate`; inline error shows selected date and earliest valid date (`2026-11-24`); submission blocked. | Inline error rendered accurately; submission prevented. | **PASS** |
| **TC-08** | Custom Validator (Advance Window & Invalid Date) | Block dates > 30 days ahead and impossible dates | Enter `2027-01-10` (and unit-test `2026-02-30`). | `noPastDateValidator` returns `dateTooFar` for `2027-01-10` and `invalidDateFormat` for `2026-02-30`. | Both rejected with specific error objects and inline guidance. | **PASS** |
| **TC-09** | Search & Filter (`[(ngModel)]`) | Locate records using search + filters | In Bookings view, type `"Elena"`, then clear and filter Status = `Pending`, then toggle `Express only`. | Table filters instantaneously; non-matching query shows empty-filter state with `Clear Filters` button. | Live filtering, subtotal recalculation, and reset worked without lag. | **PASS** |
| **TC-10** | Normal Action (Update) | Edit existing booking and recalculate charges | Click `Edit` on `BK-1002`, change weight from `4` kg to `6` kg, click `Save Changes`. | `PUT /bookings/BK-1002` updates record; `totalCharge` recalculates from `₱360.00` to `₱490.00`. | Updated row and dashboard totals reflected `₱490.00` immediately. | **PASS** |
| **TC-11** | Normal Action (Quick PATCH & Delete) | Advance status & delete booking with confirmation | Click `Start Wash` on a `Pending` row (`PATCH`); click `Delete` → `Confirm` on a test row (`DELETE`). | Status updates to `Washing`; deleted booking disappears with success feedback. | Both `PATCH` and `DELETE` persisted to `db.json`. | **PASS** |
| **TC-12** | Data Persistence | Verify changes survive full browser reload | After creating and updating bookings, hard-refresh the browser (`Ctrl+R` / `F5`). | Application re-fetches `GET /bookings` and restores all created/updated/deleted changes from `db.json`. | All modifications remained intact after reload. | **PASS** |
| **TC-13** | API Failure & Recovery | Graceful handling when mock API is offline | Stop `json-server`, click `Sync` in navbar, observe UI; restart `json-server` and click `Retry Connection`. | Navbar shows `API Offline`, red error banner appears with actionable message and `Retry Connection`; clicking Retry after restart reloads all records. | Error banner displayed cleanly without crashing; recovery succeeded. | **PASS** |

---

## 9. Installation & Running Guide

### 9.1 Prerequisites
- **Node.js:** v20.19+ or v22+/v24+ (verified on Node `v24.19.0`)
- **npm:** v10+ (verified on npm `11.17.0`)
- **Angular CLI:** v22+ (local dependency included in `package.json`)

### 9.2 Step-by-Step Setup
1. **Open the project directory:**
   ```bash
   cd LaundryBookingManager
   ```
2. **Install all dependencies (Angular 22, RxJS, Vitest, and `json-server`):**
   ```bash
   npm install
   ```
3. **Start the local mock API server (Terminal 1):**
   ```bash
   npm run api
   ```
   Verify that `http://localhost:3000/bookings` returns the 5 seeded laundry bookings from `db.json`.
4. **Start the Angular development server (Terminal 2):**
   ```bash
   npm start
   ```
   Open your browser to `http://localhost:4200`.

### 9.3 Running Automated Tests & Production Build
- **Run unit tests (custom validators, `BookingService` HTTP specs, root component):**
  ```bash
  npx ng test --watch=false
  ```
- **Run production build verification:**
  ```bash
  npm run build
  ```

---

## 10. Member Contributions, Reflections & References

### 10.1 Member Contributions
| Member | Role | Specific Contributions |
|---|---|---|
| **Member 1** | Project Coordination, Component Structure & Integration | Designed the 4-component architecture (`NavbarComponent`, `DashboardComponent`, `BookingListComponent`, `BookingFormComponent`), implemented root view orchestration in `app.ts`, and coordinated custom validator integration. |
| **Member 2** | Interface, Forms, Data Binding & Styling | Crafted the Linear/Raycast dark-mode design system (`styles.css`), implemented `BookingFormComponent` Reactive Forms, two-way bound search/filters in `BookingListComponent`, and responsive layouts. |
| **Member 3** | Services, API Integration & Data Persistence | Built `BookingService` (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), configured `provideHttpClient(withFetch())`, structured `HttpErrorResponse` handling, and authored the 5-record `db.json` dataset. |
| **Member 4** | Testing, Documentation Coordination & Verification | Authored unit tests (`booking.validators.spec.ts`, `booking.service.spec.ts`), executed all 13 manual/automated test cases including offline API failure recovery, and compiled this final documentation. |

### 10.2 Reflections & Disclosure
- **Key Takeaway:** Building custom validators taught the group how Angular Reactive Forms separate domain validation rules from UI rendering. Isolating `weightLimitValidator`, `serviceWeightCapacityValidator`, and `noPastDateValidator` into pure functions made them straightforward to unit-test and reuse.
- **AI & Reference Disclosure:** AI assistance was used to accelerate scaffolding, CSS token layout refinement, and documentation drafting. Every line of TypeScript, Reactive Form validator logic, RxJS subscription handling, and HTTP integration was reviewed, tested with Vitest and `json-server`, and verified by the group for full explanation during defense.

### 10.3 References
1. Angular Team. (2026). *Validating Form Input — Angular Documentation*. https://angular.dev/guide/forms/form-validation
2. Angular Team. (2026). *Making HTTP Requests with HttpClient*. https://angular.dev/guide/http
3. Angular Team. (2026). *Control Flow Syntax (`@if`, `@for`, `@switch`)*. https://angular.dev/guide/templates/control-flow
4. RxJS Documentation. (2026). *Observables & Error Handling (`catchError`)*. https://rxjs.dev/api/operators/catchError
5. Typicode. (2026). *JSON Server — Full Fake REST API*. https://github.com/typicode/json-server
6. Mozilla Developer Network. (2026). *Date — JavaScript Reference*. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
