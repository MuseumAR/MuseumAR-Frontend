# MuseumAR Business Rules Catalog

| Field | Value |
|---|---|
| **Document ID** | MAR-BR-CAT-001 |
| **Title** | MuseumAR Business Rules Catalog |
| **Product** | MuseumAR (Visitor web, Staff dashboard, Ticketing, Indoor navigation) |
| **Version** | 2.1 |
| **Status** | Approved for implementation / thesis submission |
| **Classification** | Internal |
| **Language** | English |
| **Effective date** | 2026-08-21 |
| **Owner** | Business Analysis / Product |
| **Audience** | Product owner, developers, QA, academic supervisor |
| **Related systems** | MuseumAR Frontend (Next.js), MuseumAR Backend (ASP.NET), PayOS, Google OAuth |

---

## 1. Purpose

This catalog defines the **authoritative business rules** of MuseumAR. A business rule is a statement that constrains, derives, or enables business behavior independently of a specific screen or API. Implementation (UI, REST, Unity) SHALL comply with these rules unless a rule is marked **Proposed**.

The catalog is the single source of truth for:

- Functional specifications and use cases (trace by Rule ID)
- UI and API acceptance criteria
- Test cases (expected result = user-visible outcome, not an HTTP status code)
- Gap analysis between *as-is* software and *to-be* product requirements

## 2. Scope

**In scope**

- Identity, authentication, email verification, password recovery
- Role-based access to visitor and staff surfaces
- Public museum / exhibit discovery, audio guide, AR, exhibit QR
- Ticket types, promotions, orders, PayOS payment, ticket QR, check-in
- Exhibits, exhibitions, taxonomy
- 2D floor plans, rooms, guided tours, navigation graph
- Content versions and offline content packages
- Museum profile, analytics, users, audit logs, system configuration
- Cross-cutting data, localization, security, and error-handling constraints

**Out of scope**

- Infrastructure SLAs, hosting capacity, and cost
- Unity engine internals except where they affect visitor-facing rules
- Legal terms of sale beyond what the product currently enforces

## 3. Conventions

Keywords follow **RFC 2119**:

| Keyword | Meaning |
|---|---|
| **SHALL** / **SHALL NOT** | Mandatory. Non-compliance is a defect. |
| **SHOULD** / **SHOULD NOT** | Strong recommendation. Deviation requires recorded justification. |
| **MAY** | Optional permitted behavior. |

**Rule types** (BABOK / SBVR):

| Type | Meaning |
|---|---|
| **Structural** | A fact that always holds (cardinality, identity, classification). |
| **Operative** | An obligation or prohibition on an actor or the system. |
| **Derivation** | How a value is calculated or inferred. |
| **Authorization** | Who may perform an action or see a resource. |

**Lifecycle status**

| Status | Meaning |
|---|---|
| **In Force** | Binding for the current product (as implemented, or required and already specified to match implementation). |
| **Proposed** | Agreed product intent that is not fully implemented. QA SHALL NOT fail current builds against Proposed rules. |

**Priority:** M = Mandatory, R = Recommended.

Rule IDs (`BR-nnn`) are stable. Do not reuse a retired ID.

## 4. Actors

| Actor | Definition |
|---|---|
| **Guest** | Unauthenticated person using public pages. |
| **Visitor** | Authenticated user with role `Visitor`. |
| **Content Manager (CM)** | Staff role `ContentManager`. Owns exhibits, exhibitions, maps, tours, versions, offline packages for an assigned museum. |
| **Museum Manager (MM)** | Staff role `MuseumManager`. Owns museum profile, ticket types, promotions, ticket operations, analytics. Read-only artifacts. |
| **System Admin (SA)** | Staff role `SystemAdmin`. Owns users, taxonomy, ticket-type catalog view, audit logs, system configuration, museum profile (system). |
| **Gate staff** | Person who validates a ticket QR at entry (may be MM or a designated operator). |
| **System** | Automated application / API behavior with no human decision. |
| **Staff** | Any of CM, MM, SA. |

Canonical role names stored in the `Roles` table: `Visitor`, `ContentManager`, `MuseumManager`, `SystemAdmin`. Display labels SHALL use these names until a translation API exists.

## 5. Core entities and structural invariants

These facts underpin all operative rules.

| ID | Type | Statement |
|---|---|---|
| INV-01 | Structural | A **User** has exactly one **Role**. |
| INV-02 | Structural | A **Museum** is the tenant boundary for content, tickets, maps, and analytics. |
| INV-03 | Structural | An **Exhibit** (artifact) has at most one physical location expressed as Floor and/or Room. An Exhibition SHALL NOT be treated as a second physical location. |
| INV-04 | Structural | An **Exhibition** is a grouping of zero or more Exhibits. Assigning or removing an Exhibit SHALL NOT move the Exhibit to another Room. |
| INV-05 | Structural | A **TicketType** belongs to exactly one Museum. It MAY optionally reference one Exhibition (`exhibitionId` null = whole-museum ticket). |
| INV-06 | Structural | An **Order** belongs to exactly one Visitor and contains one TicketType, a positive quantity, and a `totalAmount`. |
| INV-07 | Structural | A **Ticket** belongs to exactly one Order and exactly one TicketType, and has a unique `ticketCode`. |
| INV-08 | Structural | `TicketType.price` is the **unit price** of that type (catalog). `Order.totalAmount` is the **order total** (unit price × quantity, after promotion). They SHALL NOT be used interchangeably. |
| INV-09 | Structural | A **Route** (guided tour) is an ordered list of Exhibit stops on 2D floor plans. |
| INV-10 | Structural | A **Floor plan** is a 2D image. 3D assets exist only as AR models, not as indoor maps. |
| INV-11 | Structural | A published Exhibit has stable `qrCodeData`. Scanning that QR SHALL resolve to the same Exhibit record; it SHALL NOT create a new Exhibit. |
| INV-12 | Structural | Unity, when used on mobile, is the **runtime engine**, not a third-party library in the technology list. |

## 6. Business rule catalog

Column **Stmt** is the binding statement. **Cond.** is the condition under which the rule applies. **Exc.** is the exception or alternate path.

---

### 6.1 Identity, registration, and session

| ID | Name | Type | P | Status | Actor | Stmt | Cond. | Exc. |
|---|---|---|---|---|---|---|---|---|
| BR-001 | Public access without account | Operative | M | In Force | Guest | The system SHALL allow a Guest to view the home page, public museum information, and the public ticket catalog without authentication. | Guest is not logged in. | Purchase remains forbidden (BR-065). |
| BR-002 | Auth forms available | Operative | M | In Force | Guest | The system SHALL provide Register and Login entry points to a Guest. | — | — |
| BR-003 | Email format | Operative | M | In Force | System | The system SHALL accept an email only if it matches a local-part `@` domain pattern. | Register, login, forgot-password, verify-email. | Reject with “invalid email”. |
| BR-004 | Minimum password length | Operative | M | In Force | System | A password SHALL contain at least 6 characters for register, reset, and change-password. | Those flows. | Persist is refused. |
| BR-005 | Full name length | Operative | M | In Force | Visitor | On registration, full name SHALL contain at least 2 characters after trim. | Register. | — |
| BR-006 | Password confirmation | Operative | M | In Force | System | Confirm-password SHALL equal the new password. | Register, reset, change. | “Passwords do not match”. |
| BR-007 | Unique email | Operative | M | In Force | System | The system SHALL reject registration if the email already exists. | Register. | Message: email already registered. |
| BR-008 | Unverified after register | Operative | M | In Force | System | After successful registration the account SHALL be created as role Visitor and email-unverified. | Register succeeds. | Ticket purchase blocked until verified. |
| BR-009 | Email OTP format | Operative | M | In Force | Visitor | Email verification SHALL require a 6-digit numeric token. | Verify email. | Wrong or expired token refused. |
| BR-010 | Resend verification | Operative | M | In Force | System | The system SHALL allow the user to request a new verification code. | Unverified account. | Server MAY rate-limit. |
| BR-011 | Password login | Operative | M | In Force | Guest | A Guest SHALL authenticate with email and password. | Login form. | Invalid credentials: generic failure; do not disclose which field is wrong beyond product messages. |
| BR-012 | Unverified cannot purchase | Operative | M | In Force | System | The system SHALL refuse ticket purchase when the Visitor email is not verified. | Create order. | UI SHALL offer the verify-email path. Login to public pages MAY still succeed. |
| BR-013 | Inactive account | Operative | M | In Force | System | The system SHALL refuse login when the account is inactive or locked. | Login. | Message maps to inactive/invalid credentials. |
| BR-014 | Google OAuth origin | Operative | M | In Force | Guest | Google Sign-In SHALL succeed only when the page origin is listed on the OAuth client. | Google button. | Unknown origin: Google blocks the button. |
| BR-015 | Google default role | Operative | M | In Force | System | A newly created Google account SHALL receive role Visitor. | First Google login. | Staff accounts SHALL NOT be self-provisioned via Google. |
| BR-016 | Forgot password | Operative | M | In Force | Guest | A Guest SHALL request a reset using a registered email. | Forgot password. | Unknown email: non-enumerating generic response where the API so requires. |
| BR-017 | Reset token validity | Operative | M | In Force | Visitor | Password reset SHALL succeed only with a valid, unexpired token. | Reset password. | Expired token: user MUST restart forgot-password. |
| BR-018 | Change password proof | Operative | M | In Force | Authenticated | Change-password SHALL require the current password to be correct. | Change password. | Incorrect current password refused. |
| BR-019 | New password distinct | Operative | M | In Force | System | The new password SHALL differ from the current password. | Change password. | — |
| BR-020 | Logout | Operative | M | In Force | Authenticated | Logout SHALL clear access and refresh tokens on the client. | User logs out. | — |
| BR-021 | Token refresh | Operative | M | In Force | System | On API 401 the client SHALL attempt refresh using the refresh token, then retry. | Authenticated API call. | Refresh failure: redirect to Login. |
| BR-022 | Safe post-login `next` | Operative | M | In Force | System | A `next` redirect SHALL be used only if it starts with `/` and does not start with `//`. | After login. | Invalid `next` discarded; role home used. |
| BR-023 | Staff not sent to visitor next | Authorization | M | In Force | Staff | After login, Staff SHALL land on a URL under their role base path, not an arbitrary visitor `next`. | Staff login with `next`. | If `next` is inside the role base path, that URL MAY be used. |
| BR-024 | Visitor keeps public next | Operative | M | In Force | Visitor | After login, a Visitor SHALL be sent to a safe public `next` (e.g. ticket shop or ticket detail). | Visitor login. | `next` under `/admin`, `/museum-manager`, or `/content-manager` SHALL be ignored. |
| BR-025 | Closed role set | Structural | M | In Force | System | The system SHALL recognize exactly the four roles in §4. | Any authorization decision. | Unknown role: treat as unauthorized; send to `/`. |
| BR-026 | Guest blocked from dashboard | Authorization | M | In Force | Guest | A Guest SHALL NOT access `/admin`, `/museum-manager`, or `/content-manager`. | Unauthenticated request. | Redirect to Login with `next`. |

---

### 6.2 Authorization and navigation

| ID | Name | Type | P | Status | Actor | Stmt | Cond. | Exc. |
|---|---|---|---|---|---|---|---|---|
| BR-027 | RoleGuard vs URL | Authorization | M | In Force | System | Dashboard URL folders select a layout; **RoleGuard SHALL still compare** `user.roleName` to the layout role. URL alone SHALL NOT grant access. | Dashboard routes. | Mismatch: redirect to that user’s role home. |
| BR-028 | SA menu | Authorization | M | In Force | SA | System Admin SHALL see only: Museum Profile, Users, Ticket Types, Taxonomy, Audit Logs, System Configuration. | SA session. | — |
| BR-029 | MM menu | Authorization | M | In Force | MM | Museum Manager SHALL see only: Overview, Analytics, Museum Profile, Artifacts (read), Ticket Management. | MM session. | MM SHALL NOT create exhibits, maps, or offline packages. |
| BR-030 | CM menu | Authorization | M | In Force | CM | Content Manager SHALL see only: Overview, Artifacts, Exhibitions, Content Versions, Offline Packages, Maps & Routes. | CM session. | CM SHALL NOT create or sell ticket types. |
| BR-031 | Visitor has no staff sidebar | Authorization | M | In Force | Visitor | A Visitor SHALL NOT see the staff dashboard sidebar. | Visitor session. | Public navbar and My Tickets only. |
| BR-032 | SA default home | Operative | M | In Force | SA | After login with no valid `next`, SA SHALL open `/admin/museum-management`. | SA login. | — |
| BR-033 | MM default home | Operative | M | In Force | MM | After login with no valid `next`, MM SHALL open `/museum-manager/overview`. | MM login. | — |
| BR-034 | CM default home | Operative | M | In Force | CM | After login with no valid `next`, CM SHALL open `/content-manager/overview`. | CM login. | — |
| BR-035 | Visitor default home | Operative | M | In Force | Visitor | After login with no valid `next`, Visitor SHALL open `/tickets`. | Visitor login. | — |
| BR-036 | Staff not visitor shop | Authorization | M | In Force | Staff | A staff session SHALL NOT complete a Visitor ticket purchase. Ticket purchase requires a Visitor account. | Staff logged in. | Use a separate Visitor account. |
| BR-037 | Bearer on staff APIs | Authorization | M | In Force | System | Staff API calls SHALL include a Bearer access token. | Dashboard mutations and private reads. | Missing/invalid token: 401 then BR-021. |
| BR-038 | SA user administration | Operative | M | In Force | SA | SA SHALL create, update, and deactivate users and assign a role. | Users module. | SA SHOULD NOT deactivate the last remaining System Admin. |
| BR-039 | MM museum isolation | Authorization | M | In Force | MM | MM SHALL operate only on the museum bound to their account. | Ticket types, profile, analytics. | No museum: empty state; no create. |
| BR-040 | CM museum isolation | Authorization | M | In Force | CM | CM SHALL operate only on content of the museum bound to their account. | Exhibits, maps, exhibitions. | No museum: empty state. |
| BR-041 | Visitor cannot be granted staff UI | Authorization | M | In Force | SA | SA SHALL NOT grant dashboard navigation to role Visitor. | User update. | Visitor home remains `/tickets`. |
| BR-042 | Self-registration is Visitor only | Authorization | M | In Force | System | Public registration SHALL create role Visitor only. It SHALL NOT create CM, MM, or SA. | Register / Google. | Staff provisioned by SA. |

---

### 6.3 Visitor discovery, exhibit QR, audio, AR, language

| ID | Name | Type | P | Status | Actor | Stmt | Cond. | Exc. |
|---|---|---|---|---|---|---|---|---|
| BR-043 | Public museum | Operative | M | In Force | Guest, Visitor | The system SHALL allow viewing of public museum information. | Museum status Active. | Inactive museum SHALL be hidden. |
| BR-044 | Published exhibits only | Operative | M | In Force | Guest, Visitor | Visitor-facing exhibit detail SHALL be available only for Published exhibits. | Public exhibit URL / QR. | Draft / unpublished: not found / not listed. |
| BR-045 | Exhibit QR resolves identity | Operative | M | In Force | Visitor, Guest | Scanning an exhibit QR SHALL open that Exhibit’s audio, AR, and transcript surfaces. | Valid `qrCodeData`. | Invalid QR: user-visible error, no new exhibit created (INV-11). |
| BR-046 | Stable exhibit QR | Structural | M | In Force | System | A published Exhibit SHALL keep stable `qrCodeData` when only descriptive fields change. | Exhibit update. | Republish of QR only if product explicitly rotates codes. |
| BR-047 | Audio availability | Operative | M | In Force | Visitor | The Narration control SHALL appear only if the Exhibit has an audio asset for the selected language (or fallback). | Exhibit detail. | No audio: control hidden. |
| BR-048 | Autoplay narration | Operative | M | In Force | System | When the narration screen finishes loading, audio SHALL start automatically. | Narration screen. | After user pause, the system SHALL NOT auto-resume except by user action. |
| BR-049 | Player controls | Operative | M | In Force | Visitor | The Visitor SHALL be able to play, pause, seek, and skip on the audio player. | Narration screen. | — |
| BR-050 | Transcript sync | Operative | M | In Force | Visitor | If a transcript exists, the system SHALL display it and SHOULD keep it in sync with playback. | Transcript present. | No transcript: block hidden. |
| BR-051 | Back to exhibit | Operative | M | In Force | Visitor | A Back action SHALL return the Visitor to exhibit detail. | Narration / AR. | — |
| BR-052 | Listening history | Operative | M | In Force | System | For an authenticated Visitor, the system SHALL record listening duration when the Visitor leaves the narration screen. | Visitor session. | Guest: SHALL NOT persist listening history to an account. |
| BR-053 | AR when asset exists | Operative | M | In Force | Visitor | AR SHALL be offered only when an AR asset exists. | Exhibit detail. | No asset: AR hidden. |
| BR-054 | AR classification | Structural | M | In Force | System | An AR asset SHALL be classified as `Model3D` or `OverlayImage` according to the uploaded file. | CM upload. | — |
| BR-055 | Physical location of exhibit | Structural | M | In Force | System | Indoor position of an Exhibit SHALL be the Exhibit’s Floor/Room, never a fictional room of an Exhibition. | Maps, tours, labels. | Exhibition membership is grouping only (INV-04). |
| BR-056 | UI language | Operative | M | In Force | Visitor, Guest | The user SHALL be able to switch UI language between Vietnamese and English. | Language toggle. | Exhibit text follows available translations (BR-057). |
| BR-057 | Content language fallback | Derivation | M | In Force | System | Exhibit copy SHALL prefer `vi`, then fall back to another available translation. | Localized fields missing. | No translation: show exhibit code / placeholder. |
| BR-058 | Maps are 2D | Structural | M | In Force | System | Indoor maps and floor plans SHALL be 2D images. Documentation and UI SHALL NOT describe floor plans as 3D. | Maps & Routes, visitor tour. | 3D is limited to AR models (INV-10). |

---

### 6.4 Guided tour and indoor navigation

| ID | Name | Type | P | Status | Actor | Stmt | Cond. | Exc. |
|---|---|---|---|---|---|---|---|---|
| BR-059 | Start active tour | Operative | M | In Force | Visitor | The Visitor SHALL start route guidance only for an Active tour (duration and stop count visible). | Tour list. | Inactive / Draft tours SHALL NOT offer “start directions”. |
| BR-060 | Guidance overlay | Operative | M | In Force | System | While a tour is active the system SHALL show step X of Y, “You are here”, and the next exhibit. | Route mode on. | — |
| BR-061 | Next / Previous stop | Operative | M | In Force | Visitor | The Visitor SHALL move Next and Previous among ordered stops. | Route mode. | Previous disabled on the first stop. |
| BR-062 | Cross-floor via vertical connector | Operative | M | **Proposed** | System | When the next stop is on another floor, the system SHALL guide only to a STAIR or ELEVATOR waypoint, then require the Visitor to confirm the next floor. It SHALL NOT draw a single continuous path through all floors. | Path uses STAIR/ELEVATOR edge. | Until implemented, current pathfinder behavior applies; tests against this rule are waived. |
| BR-063 | Complete tour | Operative | M | In Force | Visitor | On the last stop the Visitor SHALL be able to complete the tour; the system SHALL indicate the end of the route. | Last stop. | — |
| BR-064 | Cancel tour | Operative | M | In Force | Visitor | The Visitor SHALL be able to turn off an active tour (e.g. tap the active tour again). | Route mode on. | — |
| BR-065 | Guest no visit history | Operative | M | In Force | Guest | A Guest SHALL NOT have visit or listening history stored against a user account. | Guest session. | — |

---

### 6.5 Ticketing, orders, payment, check-in

Pricing model (binding):

```
unitPrice     = TicketType.price   (after active promotion if applied)
Order.totalAmount = unitPrice × quantity
Ticket        → FK Order, FK TicketType
Ticket does not store Order.totalAmount as its own unit price
```

| ID | Name | Type | P | Status | Actor | Stmt | Cond. | Exc. |
|---|---|---|---|---|---|---|---|---|
| BR-066 | Guest cannot order | Operative | M | In Force | Guest | A Guest SHALL NOT create a ticket order. | Checkout. | UI SHALL require login. |
| BR-067 | Verified Visitor only | Operative | M | In Force | Visitor | Only a logged-in, email-verified Visitor SHALL create an order. | Create order. | Unverified: BR-012. |
| BR-068 | Sellable types | Operative | M | In Force | Visitor | The shop SHALL list only ticket types that are Active / approved for sale. | Public catalog. | Draft / Inactive types hidden. |
| BR-069 | Quantity bounds | Operative | M | In Force | Visitor | Order quantity SHALL be an integer from 1 to 10 inclusive. | Shop and checkout. | Outside range: controls disabled / rejected. |
| BR-070 | Visit date window | Operative | M | In Force | Visitor | Where the UI collects a visit date, it SHALL be within the next 7 days and SHALL NOT be in the past. | Checkout UI if date shown. | If the API does not persist visit date, this rule applies only to the UI field. |
| BR-071 | Unit price source | Derivation | M | In Force | System | Unit price SHALL be `TicketType.price`, or the promoted price when a valid promotion is applied. | Price display and order. | Client-calculated price is advisory; server is authoritative (BR-090). |
| BR-072 | Order total | Derivation | M | In Force | System | `Order.totalAmount` SHALL equal unit price × quantity (after promotion). | Order create. | — |
| BR-073 | Do not misuse order total as unit price | Operative | M | In Force | System | Ticket detail SHALL display catalog/unit price (`ticketType.price`) separately from `order.totalAmount`. The system SHALL NOT present `order.totalAmount` as the price of one ticket when quantity > 1. | Ticket detail screen. | **Defect if violated.** |
| BR-074 | Price snapshot | Operative | M | **Proposed** | System | At payment confirmation the system SHOULD persist a unit-price snapshot on the order line so later catalog price changes do not rewrite sold tickets. | Paid order. | If not implemented, detail MAY show current `ticketType.price`. |
| BR-075 | Ticket FKs | Structural | M | In Force | Ticket | Each Ticket SHALL reference exactly one Order and one TicketType. | Persistence. | — |
| BR-076 | N tickets per quantity | Operative | M | In Force | System | When quantity = N, the system SHALL create N Ticket records on the same Order. | Paid or issued order per API. | — |
| BR-077 | Pre-pay total visible | Operative | M | In Force | Visitor | The Visitor SHALL see the payable total before confirming payment. | Checkout modal. | — |
| BR-078 | Single pending order | Operative | M | In Force | System | A Visitor SHALL have at most one pending (unpaid) order at a time. | Create order. | If pending exists: do not create another; offer Continue PayOS or Cancel. |
| BR-079 | Pending TTL 15 minutes | Operative | M | In Force | System | A pending order SHALL expire after 15 minutes. The client SHALL show a countdown. | Pending order. | After expiry the client SHALL stop checkout; if server cancel fails, instruct the user to check My Tickets. |
| BR-080 | PayOS checkout | Operative | M | In Force | Visitor | Payment SHALL proceed via PayOS (hosted checkout URL and/or VietQR). | Confirm & pay. | — |
| BR-081 | Payment method vs status | Structural | M | In Force | System | `paymentMethod` SHALL store the channel (e.g. PayOS / VietQR). `paymentStatus` SHALL store Paid / Pending / Cancelled. They SHALL NOT be displayed as each other. | Ticket / order UI. | — |
| BR-082 | Paid only after confirmation | Operative | M | In Force | System | An order SHALL become Paid only after PayOS confirmation (webhook or status API). Client-side “I paid” SHALL NOT mark Paid. | Payment. | Polling MAY update UI after server confirms. |
| BR-083 | Payment result screens | Operative | M | In Force | Visitor | The Visitor SHALL be shown success, pending, or cancelled outcomes. | Return from PayOS / poll. | — |
| BR-084 | Cancel pending only | Operative | M | In Force | Visitor | The Visitor SHALL cancel only a pending unpaid order. | Cancel action. | Paid orders SHALL NOT be cancelled by the Visitor. |
| BR-085 | My Tickets list | Operative | M | In Force | Visitor | My Tickets SHALL list the current user’s tickets with code, date, and status (Paid / Pending / Cancelled / Used as returned). | Authenticated. | Paid tickets appear after server confirmation. |
| BR-086 | Ticket detail fields | Operative | M | In Force | Visitor | Ticket detail SHALL show type name, ticket code, status, museum, address, exhibition (if any), order code, **order total**, purchase date, validity, and payment method. | Ticket detail. | Unit price vs total: BR-073. |
| BR-087 | Check-in QR for paid tickets | Operative | M | In Force | Visitor | A check-in QR SHALL be shown only when the ticket is paid / active. | Ticket detail. | Pending / Cancelled: no gate QR. |
| BR-088 | Self check-in (as-is) | Operative | M | In Force | Visitor | A paid unused ticket MAY be self-checked-in from ticket detail. | Paid + not used. | Already used: refused (“Ticket already used”). |
| BR-089 | Gate validation | Operative | M | In Force | Gate staff | Gate staff SHALL validate a ticket by scanning its QR; a successful check-in SHALL be recorded once. | Entry. | Used ticket refused. |
| BR-090 | Invalid check-in | Operative | M | In Force | System | The system SHALL refuse check-in if the ticket is expired, cancelled, not paid, not found, or already used. | Check-in API. | Mapped user messages, no SQL/stack traces. |
| BR-091 | Check-in is irreversible | Operative | M | In Force | System | Successful check-in SHALL set used state (`usedAt` or equivalent). A second check-in SHALL fail. | After first success. | — |
| BR-092 | Unique ticket code | Structural | M | In Force | System | `ticketCode` SHALL be unique and SHALL NOT be editable by the Visitor. | Issue ticket. | Generated by server. |
| BR-093 | My Tickets isolation | Authorization | M | In Force | Visitor | My Tickets and ticket detail SHALL return only tickets owned by the authenticated `userId`. | GET my-tickets. | Others’ tickets: not found / forbidden. |
| BR-094 | Public catalog without login | Operative | M | In Force | Guest | A Guest SHALL view public prices without logging in. | Ticket shop. | Purchase: BR-066. |
| BR-095 | Client cannot set price | Operative | M | In Force | Visitor | The client SHALL send `ticketTypeId`, `quantity`, and optional `promotionId` only. The server SHALL recompute amount. | Create order. | Tampered amount ignored. |
| BR-096 | Currency display | Operative | M | In Force | System | Monetary amounts SHALL be displayed as VND using `vi-VN` grouping. | Any price UI. | — |

---

### 6.6 Museum Manager — ticket types and promotions

| ID | Name | Type | P | Status | Actor | Stmt | Cond. | Exc. |
|---|---|---|---|---|---|---|---|---|
| BR-097 | Create ticket type | Operative | M | In Force | MM | MM SHALL create a ticket type with museumId, non-empty name, and price ≥ 0. | Create form. | `exhibitionId` optional. |
| BR-098 | Publish before sale | Operative | M | In Force | MM | A ticket type SHALL be Active / approved before it appears in the public shop. | Status change. | Pending / Inactive not sold. |
| BR-099 | Exhibition on type | Operative | M | In Force | MM | If set, `exhibitionId` SHALL reference an Exhibition of the same museum. | Create/update type. | Whole museum: `exhibitionId` null. |
| BR-100 | Clear exhibition sends null | Operative | M | In Force | System | When MM selects whole-museum, the update payload SHALL send `exhibitionId: null`, not omit the field (omission would retain the old FK). | Update ticket type. | **Implemented intent;** omitting the field is a defect. |
| BR-101 | Promotion shape | Operative | M | In Force | MM | A promotion SHALL have name, type Percentage (0–100) or FixedAmount (≥ 0), start date, and end date. | Create promotion. | End &lt; start refused. |
| BR-102 | Promotion applicability | Derivation | M | In Force | System | A promotion SHALL apply only if `isActive` is true and current time is within [start, end]. | Checkout / price. | Inactive or out-of-window: ignored. |
| BR-103 | SA ticket types view-only | Authorization | M | In Force | SA | SA ticket-types UI SHALL be view-only. SA SHALL NOT create types in that UI. | Admin ticket types. | MM owns create/update. |
| BR-104 | Non-negative price | Operative | M | In Force | MM | Ticket type price SHALL NOT be negative. | Create/update. | — |
| BR-105 | Shop ignores exhibition filter | Operative | M | In Force | System | The public shop SHALL list active types for the museum and SHALL NOT require the Visitor to pick an exhibition filter. | Ticket shop. | Type may still carry exhibition metadata. |
| BR-106 | List table exhibition column | Operative | R | In Force | MM | MM ticket-type list MAY omit an exhibition column; exhibition is edited on the type detail. | List view. | — |

---

### 6.7 Content Manager — exhibits and exhibitions

| ID | Name | Type | P | Status | Actor | Stmt | Cond. | Exc. |
|---|---|---|---|---|---|---|---|---|
| BR-107 | Museum required to author | Operative | M | In Force | CM | CM SHALL have an assigned museum before creating content. | Create exhibit / map. | Empty state. |
| BR-108 | Exhibit title required | Operative | M | In Force | CM | Creating an exhibit SHALL require a title (Vietnamese and/or English per form). | Create. | Empty name refused. |
| BR-109 | Default draft | Operative | M | In Force | System | A newly created exhibit SHALL start as Draft. | Create. | Not visitor-visible until Published (BR-044). |
| BR-110 | Optional taxonomy and location | Operative | M | In Force | CM | CM MAY assign category, age group, era, room, and map. | Create/edit. | — |
| BR-111 | Media after exhibit exists | Operative | M | In Force | CM | Image, audio (VI/EN), and AR uploads SHALL occur after an `exhibitId` exists. | Wizard. | Skipping a file SHALL skip that step without failing the exhibit create. |
| BR-112 | Publish / unpublish | Operative | M | In Force | CM | CM SHALL publish or unpublish from the artifact table. | Status action. | Unpublished hidden from visitors. |
| BR-113 | Delete exhibit | Operative | M | In Force | CM | CM SHALL delete an exhibit only after confirmation. | Delete. | Backend MAY refuse if referenced by a route. |
| BR-114 | Floor/Room is the location | Operative | M | In Force | CM | Changing physical location SHALL be done on the exhibit Floor/Room fields, not by assigning an exhibition. | Edit exhibit. | — |
| BR-115 | Assignment is not a move | Operative | M | In Force | CM | Assigning an exhibit to an exhibition SHALL NOT be used as a “move artifact” command. | Exhibition exhibits. | Physical move = controlled Room change. |
| BR-116 | Delete AR asset | Operative | M | In Force | CM | CM SHALL be able to remove an existing AR asset from edit, after confirmation. | Edit exhibit. | — |
| BR-117 | Exhibition dates | Operative | M | In Force | CM | Exhibition name is required. End date SHALL be on or after start date. | Create/update. | — |
| BR-118 | Theme | Operative | M | In Force | CM | CM SHALL select an existing theme or create a theme by name. | Exhibition form. | — |
| BR-119 | Many exhibits per exhibition | Operative | M | **Proposed** | CM | CM SHALL assign **multiple** exhibits to one exhibition in one action (multi-select). The API already accepts `exhibitIds[]`. | Assign exhibits. | **As-is UI** assigns one exhibit per action; that is a gap, not the rule. |
| BR-120 | Unassign keeps exhibit | Operative | M | In Force | CM | Removing an exhibit from an exhibition SHALL NOT delete the exhibit from the museum. | Unassign. | — |
| BR-121 | No parallel exhibition room | Structural | M | In Force | System | An exhibition SHALL NOT own a room that overrides exhibit Room. | Domain model. | Rooms belong to the room master / exhibit. |
| BR-122 | Exhibition status | Operative | M | In Force | CM | CM SHALL set exhibition status to Active, Inactive, or Ended (or equivalent API values). | Update. | Ended: SHOULD NOT attach new ticket types. |
| BR-123 | Exhibit tags | Operative | M | In Force | CM | CM SHALL manage tags and assign them to exhibits. | Taxonomy on exhibit. | — |
| BR-124 | SA owns shared taxonomy | Operative | M | In Force | SA | SA SHALL CRUD category, theme, tag, and tag group used across the museum. | Admin taxonomy. | CM consumes them when authoring. |
| BR-125 | Exhibit code uniqueness | Operative | M | In Force | CM | If an exhibit code is supplied, it SHALL be unique within the museum. | Create/update. | Duplicate: backend error. |
| BR-126 | Thumbnail | Derivation | M | In Force | System | Exhibit thumbnail SHALL come from the uploaded image; if none, a placeholder SHALL be shown. | Lists and cards. | — |
| BR-127 | Image MIME | Operative | M | In Force | CM | Map and exhibit image uploads SHALL be `image/*` (PNG, JPG, WEBP as accepted by the form). | Upload. | Other types refused. |
| BR-128 | Confirm destructive actions | Operative | M | In Force | Staff | Delete of exhibit, route, map, promotion, or AR SHALL require an explicit confirm. | Delete UI. | — |

---

### 6.8 Maps, rooms, tours, navigation graph

| ID | Name | Type | P | Status | Actor | Stmt | Cond. | Exc. |
|---|---|---|---|---|---|---|---|---|
| BR-129 | Upload floor plan | Operative | M | In Force | CM | CM SHALL upload a named 2D map image (PNG/JPG/WEBP). | Maps module. | — |
| BR-130 | Map type | Operative | M | In Force | CM | Map type SHALL be Floor plan or Overview; a floor number is required for a floor plan. | Create/update map. | — |
| BR-131 | Edit/delete map | Operative | M | In Force | CM | CM SHALL update or delete a floor plan; delete requires confirm. | Maps. | — |
| BR-132 | Room identity | Operative | M | In Force | CM | A room SHALL have roomCode, roomName, and floor. It MAY link to a map. | Create room. | — |
| BR-133 | Delete room | Operative | M | In Force | CM | CM MAY delete a room when backend constraints allow. | Delete. | Refuse if exhibits still bound, if API so enforces. |
| BR-134 | Tour name and stops | Operative | M | In Force | CM | A tour SHALL have a name and an ordered list of exhibit stops. | Create route. | — |
| BR-135 | Unique stop | Operative | M | In Force | CM | The same exhibit SHALL NOT appear twice on one route. | Add stop. | — |
| BR-136 | Stop order | Structural | M | In Force | System | Stop order SHALL be a contiguous sequence 1..n. | Save route. | Reorder API if used. |
| BR-137 | Route status | Operative | M | In Force | CM | Route status SHALL be Active, Draft, or Inactive. Visitors SHALL see only Active. | Publish. | — |
| BR-138 | One default route | Operative | M | In Force | CM | At most one route per museum SHALL be `isDefault`. | Tick default. | Backend unique constraint. |
| BR-139 | Waypoint types | Operative | M | In Force | CM | CM SHALL place waypoints of types HALLWAY, DOOR, STAIR, ELEVATOR (and LOBBY if supported) on the 2D map. | Graph editor. | — |
| BR-140 | One door per room | Operative | M | In Force | System | A Door waypoint SHALL NOT reuse a `roomId` that already has a door waypoint. | Add door. | — |
| BR-141 | Edges | Operative | M | In Force | CM | CM SHALL connect two waypoints. Same-floor connection is WALK; different floor SHALL use STAIR or ELEVATOR. | Connect mode. | — |
| BR-142 | Test path | Operative | M | In Force | CM | CM SHALL test a path between two rooms. | Test path. | No path: “not found”, not a stack trace. |
| BR-143 | Preview is not a visit | Operative | M | In Force | CM | Mobile route preview SHALL show You are here / Next and SHALL NOT write Visitor visit history. | Preview. | — |
| BR-144 | Vertical guidance | Operative | M | **Proposed** | System | Visitor path display SHALL stop at STAIR/ELEVATOR per BR-062. | Cross-floor path. | Same as BR-062. |

---

### 6.9 Content versions and offline packages

| ID | Name | Type | P | Status | Actor | Stmt | Cond. | Exc. |
|---|---|---|---|---|---|---|---|---|
| BR-145 | Create version | Operative | M | In Force | CM | CM SHALL create a content version with a version identifier and description. | Versions module. | — |
| BR-146 | Publish before pack | Operative | M | In Force | CM | An offline package SHOULD be generated only from a published version. | Generate package. | Draft: refuse if API enforces. |
| BR-147 | Package bound to version | Structural | M | In Force | System | An offline package SHALL reference exactly one `versionId`. | Create package. | — |
| BR-148 | Package status and size | Operative | M | In Force | System | The system SHALL persist `packageSizeBytes` and status (e.g. Building, Available). | After generate. | Building: download disabled. |
| BR-149 | Download when Available | Operative | M | In Force | CM | CM SHALL download the ZIP only when status is Available and `packageUrl` is present. | Download. | — |
| BR-150 | Do not force unused media | Operative | R | **Proposed** | System | The visitor SHALL NOT be required to download audio, images, and AR for exhibits outside the visit scope. Scope is resolved per BR-180. Per-exhibit lazy load (BR-184) satisfies the “split heavy media” intent; three ZIPs by MIME type are not required. | Offline download. | As-is: one museum ZIP. Spec: `docs/OFFLINE-PACKAGES.md`. |
| BR-151 | Media counts | Derivation | M | In Force | System | `imageCount`, `audioCount`, and `arassetCount` SHALL reflect files in the package. The UI SHALL display API values and SHALL NOT invent counts from the ZIP locally. | Package list. | If API returns 0, UI shows 0. When a pack is exhibition-scoped, counts SHALL be that exhibition only. |
| BR-152 | Offline consumption | Operative | M | In Force | Visitor (mobile) | The Visitor MAY use a downloaded package offline for that version. | No network. | Newer version: download again. Missing exhibit media: BR-184. |
| BR-178 | Media pack optional exhibition | Structural | M | **Proposed** | System | A Layer B media pack SHALL have `ExhibitionId` null (whole museum) or a single exhibition of the same museum. | Generate / persist. | Navigation pack is a distinct kind (BR-179). |
| BR-179 | Navigation pack vs media pack | Structural | M | **Proposed** | System | Layer A (navigation: 2D floor plans, rooms, waypoints, tours, exhibit metadata) SHALL be a museum-wide pack and SHALL NOT include exhibit audio or AR. Layer B SHALL include exhibit images, audio, and AR only, and SHALL NOT re-pack all museum floor-plan PNGs. | Package generate. | — |
| BR-180 | Resolve media pack from ticket | Derivation | M | **Proposed** | System | If the Visitor has a paid ticket whose type has `exhibitionId` E, `mediaPackage` SHALL be the Available exhibition pack for E. If the paid ticket is whole-museum (`exhibitionId` null), `mediaPackage` SHALL be the whole-museum media pack. The system SHALL NOT require downloading every exhibition ZIP. | Visitor sync. | No paid ticket: `mediaPackage` null (BR-184). |
| BR-181 | Guest / unpaid skip Layer B | Operative | M | **Proposed** | Guest | Without a paid ticket, the client SHALL NOT download a Layer B media ZIP. | Sync / first launch. | Layer C MAY run while online. |
| BR-182 | Ordered download pipeline | Operative | M | **Proposed** | Visitor (mobile) | The client SHALL: (1) sync version, (2) download Layer A, (3) download at most one Layer B pack from BR-180, (4) on QR/detail, Layer C if that exhibit is not cached. | Offline sync. | SHALL NOT prefetch all exhibition ZIPs. |
| BR-183 | Empty exhibition not packed | Operative | M | **Proposed** | System | Generate SHALL refuse an exhibition that has zero exhibits. | CM generate. | No empty Available ZIP. |
| BR-184 | On-demand exhibit media | Operative | M | **Proposed** | Visitor (mobile) | If exhibit media is not in the Layer B cache, the client SHALL fetch that exhibit’s audio/image/AR when the Visitor opens QR or detail and the device is online, then cache it. If offline and missing, the client SHALL show the existing unavailable state for that media, not fail the visit. | Exhibit QR / detail. | — |
| BR-185 | Exhibition must match museum | Operative | M | **Proposed** | System | Generate with `exhibitionId` SHALL fail if that exhibition is not owned by the pack’s museum. | Generate. | — |
| BR-186 | Restrict delete exhibition with packs | Operative | M | **Proposed** | System | Deleting an exhibition SHALL be refused while an offline pack references it. `ExhibitionId` SHALL NOT be set to null on delete. | Delete exhibition. | Remove or archive packs first. |
| BR-187 | Unique media packs | Structural | M | **Proposed** | System | At most one Building/Available whole-museum media pack per `(museumId, versionId)`. At most one Building/Available exhibition media pack per `(museumId, versionId, exhibitionId)`. SQL unique indexes SHALL be filtered so multiple `NULL` exhibition ids cannot duplicate museum packs. | Persist pack. | Second generate of the same key SHALL be rejected. |
| BR-188 | Visitor sync contract | Operative | M | **Proposed** | System | Visitor sync SHALL return `versionId`, a navigation pack descriptor, and `mediaPackage` nullable as resolved by BR-180. Returning only one museum-wide ZIP with no scope SHALL be treated as the as-is gap, not the to-be contract. | `GET /api/visitor/sync-check` (or successor). | — |
| BR-189 | CM selects scope | Operative | M | **Proposed** | CM | When generating a media pack, CM SHALL select Whole museum or one exhibition. The request SHALL send `exhibitionId` null/omit or a valid id. | Offline Packages form. | As-is form sends `versionId` only. |
| BR-190 | Canonical ZIP names | Operative | R | **Proposed** | System | Whole-museum media file name SHALL be `museum_{museumId}_v{versionId}.zip`. Exhibition media SHALL be `museum_{museumId}_exhibition_{exhibitionId}_v{versionId}.zip`. | Store blob. | Do not use `exhib_` as the token. |

---

### 6.10 Museum Manager — profile and analytics

| ID | Name | Type | P | Status | Actor | Stmt | Cond. | Exc. |
|---|---|---|---|---|---|---|---|---|
| BR-153 | Edit assigned profile | Operative | M | In Force | MM | MM SHALL view and update the assigned museum profile. | Profile module. | No profile: empty state. |
| BR-154 | Museum name required | Operative | M | In Force | System | Museum name SHALL be required. Optional email SHALL be valid; optional phone SHALL have at least 8 digits if provided. | Create/update museum. | — |
| BR-155 | Analytics | Operative | M | In Force | MM | MM SHALL view analytics: QR scans, audio duration, popular exhibits, language usage. | Analytics. | No museum: empty. |
| BR-156 | Artifacts read-only for MM | Authorization | M | In Force | MM | MM SHALL view artifacts and SHALL NOT edit CM-owned content fields. | Artifact pages under MM. | Content edits = CM. |

---

### 6.11 System Admin — users, config, audit

| ID | Name | Type | P | Status | Actor | Stmt | Cond. | Exc. |
|---|---|---|---|---|---|---|---|---|
| BR-157 | System museum profile | Operative | M | In Force | SA | SA SHALL view (and update where the API allows) the system museum profile. | Admin museum. | Single-museum deployment. |
| BR-158 | User CRUD | Operative | M | In Force | SA | SA SHALL create and update users: name, email, role, status. | Users. | BR-038, BR-041. |
| BR-159 | User search | Operative | M | In Force | SA | SA SHALL filter users by name, email, and/or role. | Users. | — |
| BR-160 | Audit immutable | Operative | M | In Force | SA | SA SHALL view paginated audit logs and SHALL NOT edit or delete log entries in the UI. | Audit module. | — |
| BR-161 | Audit write | Operative | M | In Force | System | The system SHALL write an audit record for significant create/update/delete operations. | Staff mutations. | — |
| BR-162 | System config | Operative | M | In Force | SA | SA SHALL view and update configuration by key. | Config module. | Unknown key: not found. |
| BR-163 | Password storage | Operative | M | In Force | System | Passwords SHALL be stored hashed. The system SHALL NOT persist plaintext passwords. | Register / reset. | — |
| BR-164 | Session expiry | Operative | M | In Force | Authenticated | When the session cannot be refreshed, the user SHALL be returned to Login and SHALL NOT remain on a dashboard as if authenticated. | Refresh fail. | BR-021. |

---

### 6.12 Cross-cutting: data, security, UX, documentation

| ID | Name | Type | P | Status | Actor | Stmt | Cond. | Exc. |
|---|---|---|---|---|---|---|---|---|
| BR-165 | DTO normalization | Operative | M | In Force | System | The frontend SHALL accept camelCase and PascalCase DTO payloads and normalize them before UI use. | All API reads. | — |
| BR-166 | Secrets not in git | Operative | M | In Force | System | `.env` files containing secrets SHALL NOT be committed. | Source control. | — |
| BR-167 | Production API HTTPS | Operative | M | In Force | System | Production frontend SHALL call `NEXT_PUBLIC_API_URL` over HTTPS. | Production. | Local MAY use HTTP. |
| BR-168 | CORS allow-list | Operative | M | In Force | System | The API SHALL accept the deployed frontend origin and local origin as configured. | Browser calls. | Unknown origin: network failure mapped to a friendly message. |
| BR-169 | OAuth allow-list | Operative | M | In Force | System | Google OAuth SHALL allow only registered JavaScript origins. | Google login. | BR-014. |
| BR-170 | Database not public | Operative | M | In Force | System | Azure SQL SHALL NOT be opened to `0.0.0.0`. Client tools SHALL use firewall IP rules. App Service SHALL use the allowed server path. | Production data. | Frontend SHALL NEVER embed SQL credentials. |
| BR-171 | Page fetch / component render | Operative | R | In Force | System | Dashboard pages SHOULD fetch data; presentational components SHOULD receive props. Interactive widgets MAY fetch on the client. | Dashboard. | — |
| BR-172 | Status labels | Operative | M | In Force | System | Status enums SHALL be shown via `labelStatus` (API value as-is) until a translation API exists. | Badges. | — |
| BR-173 | Floor plan wording | Operative | M | In Force | Authors | Product documents SHALL call indoor maps **2D floor plans**, not 3D maps. | Thesis / manuals. | INV-10. |
| BR-174 | Unity wording | Operative | M | In Force | Authors | Documents SHALL list Unity as the **engine**, not as a third-party library. | Tech stack chapter. | Engine packages MAY be listed separately. |
| BR-175 | Dynamic dashboard | Operative | M | In Force | System | Staff dashboard routes SHALL use dynamic rendering so lists are not served from a stale cache. | Dashboard pages. | — |
| BR-176 | Friendly errors | Operative | M | In Force | System | User-visible errors SHALL be friendly mapped messages. SQL exceptions, stack traces, and raw HTML SHALL NOT be shown. | Any failure. | — |
| BR-177 | Login required copy | Operative | M | In Force | Guest | Features that require an account (purchase, My Tickets) SHALL be listed as common product features: Login and Register. | Thesis feature list / UX. | Guest catalog still public. |

---

## 7. Rule count

| Section | IDs | Count |
|---|---|---|
| 5. Invariants | INV-01 … INV-12 | 12 |
| 6.1 Identity | BR-001 … BR-026 | 26 |
| 6.2 Authorization | BR-027 … BR-042 | 16 |
| 6.3 Discovery / AR / audio | BR-043 … BR-058 | 16 |
| 6.4 Tour / navigation | BR-059 … BR-065 | 7 |
| 6.5 Ticketing | BR-066 … BR-096 | 31 |
| 6.6 MM tickets | BR-097 … BR-106 | 10 |
| 6.7 Exhibits / exhibitions | BR-107 … BR-128 | 22 |
| 6.8 Maps / graph | BR-129 … BR-144 | 16 |
| 6.9 Versions / offline | BR-145 … BR-190 | 21 |
| 6.10 MM profile | BR-153 … BR-156 | 4 |
| 6.11 Admin | BR-157 … BR-164 | 8 |
| 6.12 Cross-cutting | BR-165 … BR-177 | 13 |
| **Total statements** | INV + BR | **202** |
| **BR-only (BR-001…BR-190)** | | **190** |

Invariants MAY be numbered as BR-INV in the thesis if the supervisor counts only `BR-*`. Combining INV-01…12 with BR-001…BR-190 exceeds 100. BR-153…BR-177 remain in §6.10–§6.12; §6.9 continues at BR-178 so existing IDs are stable.

**In Force vs Proposed (do not mix in test sign-off)**

| Proposed ID | Intent | Current gap |
|---|---|---|
| BR-062, BR-144 | Stop guidance at stairs/elevator, then choose floor | Path may still be drawn across floors |
| BR-074 | Snapshot unit price at purchase | Detail may show live `ticketType.price` |
| BR-119 | Multi-select exhibits on an exhibition | UI adds one exhibit per action; API already allows an array |
| BR-150, BR-178–BR-190 | Exhibition-scoped media + navigation pack + ticket-based sync + lazy exhibit media | As-is: one museum ZIP; `sync-check` returns a single pack. Spec: `docs/OFFLINE-PACKAGES.md` |

## 8. Traceability (use case → rules)

| Use case | Primary rules |
|---|---|
| UC-Register / Verify / Login / Forgot password | BR-001–BR-026, BR-042, BR-163, BR-164 |
| UC-Purchase ticket | BR-066–BR-084, BR-094–BR-096, BR-012 |
| UC-My Tickets / Ticket detail | BR-073, BR-085–BR-093, BR-081 |
| UC-Check-in | BR-087–BR-091 |
| UC-Browse exhibit / Scan exhibit QR / Audio / AR | BR-043–BR-058, INV-11 |
| UC-Follow guided tour | BR-059–BR-065, BR-062 |
| UC-CRUD exhibit | BR-107–BR-116, BR-125–BR-128 |
| UC-CRUD exhibition / assign exhibits | BR-117–BR-122, BR-119 |
| UC-Maps, rooms, graph, tours | BR-129–BR-144 |
| UC-Offline package | BR-145–BR-152, BR-178–BR-190; `docs/OFFLINE-PACKAGES.md` |
| UC-MM ticket types / promotions | BR-097–BR-106 |
| UC-Admin users / audit / config | BR-157–BR-164 |

Test cases SHALL reference Rule IDs. Expected result SHALL be a **screen or user-visible state**, not an HTTP status code.

Sequence diagrams for persistence use cases SHALL show **Repository** and **Unit of Work** on the backend, in addition to Controller / Service.

## 9. Definitions

| Term | Definition |
|---|---|
| **Exhibit / Artifact** | A catalogued object with optional audio, AR, QR, and a physical Room/Floor. |
| **Exhibition** | A named grouping of exhibits for a period; not a physical room. |
| **TicketType** | Sellable product: name, unit price, museum, optional exhibition. |
| **Order** | Payment grouping: visitor, type, quantity, `totalAmount`, payment status. |
| **Ticket** | Issued admission instrument with unique code, FKs to Order and TicketType. |
| **Pending order** | Unpaid order within the 15-minute PayOS window. |
| **Floor plan** | 2D raster map of a floor. |
| **Waypoint** | Graph node on a floor plan (door, hallway, stair, elevator). |
| **Route / Tour** | Ordered exhibit stops for guided visiting. |
| **Offline package** | Downloadable snapshot of a content version. To-be: Layer A navigation pack vs Layer B media pack (museum-wide or one exhibition). |
| **Navigation pack** | Museum-wide Layer A: 2D floor plans, rooms, graph, tours, exhibit metadata. No exhibit audio/AR. |
| **Media pack** | Layer B ZIP of exhibit images, audio, and AR; whole museum or one exhibition. |
| **RoleGuard** | Client check that `user.roleName` matches the dashboard layout role. |

## 10. Assumptions and constraints

1. One production museum tenant unless SA/MM data indicates otherwise.
2. PayOS is the only online payment channel in this version.
3. Public shop does not filter by exhibition.
4. Maximum tickets per checkout is 10 (`MAX_QTY`).
5. Pending order TTL is 15 minutes.
6. Password minimum length is 6 (current validation).
7. Verification code is 6 digits.
8. Staff dashboards are English labels; visitor surface is VI/EN.
9. Offline to-be behavior is specified in `docs/OFFLINE-PACKAGES.md`. Current software still ships one museum-wide media ZIP.

## 11. Revision history

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-08-21 | BA | Initial Vietnamese summary catalog |
| 2.0 | 2026-08-21 | BA | Full English enterprise catalog: RFC 2119, invariants, In Force/Proposed, traceability, ticketing price model |
| 2.1 | 2026-08-26 | BA | Offline to-be: BR-178–BR-190; BR-150 recast as visit-scope + lazy load. See `docs/OFFLINE-PACKAGES.md`. |

## 12. How to paste into the thesis

1. Copy **§1–§5** as the introduction to *Business Rules*.
2. Copy each **§6.x** table (or convert to Word table: ID | Statement | Actor | Exception).
3. Under every Use Case: `Related rules: BR-xxx, BR-yyy`.
4. Mark **Proposed** rules in italic or a “To-be” column so the supervisor does not treat them as unimplemented defects.
5. Keep INV-08 / BR-073 in the Order vs Ticket discussion — this is the pricing rule examiners ask about.
