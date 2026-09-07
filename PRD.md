# PRD — Quick Message + Quick Call + Broadcast Call System

**Project Root:** `quick-call-n-sms/`  
**Date:** 2026-04-02  
**Prepared for:** Bank Asia Agent Banking operational messaging/calling workflow (Bangladesh)

---

## 1) Product Summary

A **privacy-first, local-first communication system** to import customer contacts (ABS CSV + Google Contacts CSV), deduplicate, and run:

- Bulk SMS campaigns (Bangla/English)
- 1:1 SMS/manual message
- Optional WhatsApp Business messaging (subject to official API constraints)
- Broadcast calling with uploaded announcement audio (MP3/WAV, etc.)
- Detailed delivery/call status tracking
- Retry/recall for failed numbers
- Printable reports

System has two platforms:

1. **Base (Engine)** (`quick-call-n-sms/mobile-app`): Android app/plugin responsible for SIM-based SMS/calls.
2. **Controls** (`quick-call-n-sms/web-app`): Next.js web app for all operations and admin.

**Core requirement:** No cloud storage of customer communication data; device-to-device sync over local network/hotspot/LAN.

---

## 2) Goals & Non-Goals

### 2.1 Goals

- Import large customer datasets (thousands+).
- Handle duplicate contacts intelligently.
- Launch campaign actions in one click (with safety confirmations).
- Track end-to-end status for every target.
- Generate and store campaign reports locally.
- Enable re-run/retry for failed targets.
- Provide role-based SaaS admin and subscription controls.
- Keep operating cost minimal (self-host web on Vercel, local execution for telecom actions).

### 2.2 Non-Goals (v1)

- Full cloud telephony/SMS gateway integration (costly, vendor dependency).
- iOS base app.
- AI-generated campaign content.
- Automatic payment gateway onboarding with enterprise contracts.

---

## 3) Users & Roles

### 3.1 Primary User

- Agent banking operator/manager sending campaign messages/calls.

### 3.2 SaaS Roles

- **Super Admin:** platform-level stats, tenant management, global settings.
- **Admin (Tenant Owner):** own org users, templates, campaigns, reports, billing status.
- **Operator:** execute imports, campaigns, retries, report export/print.
- **Viewer (optional):** read-only analytics/reports.

---

## 4) Key Use Cases

1. Import ABS customer CSV.
2. Import Google Contacts CSV.
3. Auto deduplicate + preview merge result before commit.
4. Select campaign type:
   - Bulk SMS
   - Single-recipient SMS
   - Broadcast call with uploaded audio
   - Optional WhatsApp outbound (if connected)
5. Choose segment/filter (all, failed from previous campaign, uploaded report list).
6. Select SIM from mobile base app.
7. Start campaign and watch real-time statuses.
8. Retry failed numbers.
9. Generate printable report (now or later).
10. Backup, restore, reset system locally.
11. SaaS owner monitors users/payments/plans.

---

## 5) Functional Requirements

## FR-1 Contact Management

- Import CSV from:
  - ABS export format
  - Google Contacts CSV format
- CSV mapping UI (auto-map known headers + manual override).
- Validate phone format (Bangladesh normalization, e.g., `01XXXXXXXXX`, country code handling).
- Deduplication modes:
  - Strict: exact mobile number
  - Normalized: number after country-code normalization
  - Composite (optional): name + number
- Dedup action:
  - Skip duplicate
  - Merge selected fields
  - Keep latest imported
- Maintain import logs (file name, date/time, rows processed, errors).
- Contact tags/segments (e.g., area/union/agent/review status).

## FR-2 Messaging (SMS)

- Campaign compose in Bangla/English (Unicode support).
- 1-click bulk send to selected audience.
- 1:1 send to single number/contact.
- Template save/reuse.
- Throughput controls:
  - Delay between messages
  - Daily cap / batch size
- Statuses:
  - Queued
  - Sending
  - Sent
  - Delivered (if available from device/SIM feedback)
  - Failed (with reason)
- Retry failed recipients only.

## FR-3 WhatsApp (Optional Feature Flag)

- Integrate only via compliant approach:
  - WhatsApp Business Platform API (official) OR
  - device-assisted approach with clear limitation notice.
- Support media attachments (image/pdf/audio/video where allowed).
- Track per-recipient status where possible.
- Must be clearly marked “Optional / Depends on account approval & API access.”

## FR-4 Broadcast Calling

- Upload announcement audio (`.mp3`, `.wav`, extensible list).
- Validate duration, format, and file size.
- Queue outbound calls one by one from selected SIM via Android base app.
- During call:
  - dial target
  - play announcement on answered call
- Store call outcomes:
  - Ringing
  - Answered
  - Not Answered
  - Busy
  - Switched Off/Unavailable
  - Failed
- If answered, capture call duration.

## FR-5 Campaign Operations

- Campaign wizard:
  1. Target selection
  2. Message/audio content
  3. SIM/device selection
  4. Schedule (now/later)
  5. Confirm & execute
- Live dashboard with success/failure counters.
- Pause/resume/cancel campaign.
- Re-run options:
  - failed only
  - all
  - imported list from previous report file

## FR-6 Reports

- Generate campaign report:
  - summary metrics
  - recipient-level detail
  - failure reasons
- Export formats:
  - CSV
  - PDF (print ready)
- Print now or later.
- Upload prior report and reconstruct recipient list for recall/resend.

## FR-7 Device Pairing & Auth

- Web app login via QR shown on web, scanned by mobile app.
- Session persists until:
  - manual logout
  - key invalidation/interruption
- Multi-device policy configurable (single active session recommended in v1).
- Local secure handshake over LAN/hotspot.

## FR-8 Local-First Sync (No Cloud Customer Data)

- Data channel between mobile and web over:
  - same Wi-Fi LAN OR
  - laptop connected to mobile hotspot
- End-to-end encrypted sync tunnel.
- No upload of PII/customer datasets to cloud.
- Optional local desktop relay if direct connection unavailable.

## FR-9 Backup/Restore/Reset

- Manual local backup export (encrypted file).
- Restore from backup.
- Full reset option with confirmation and recovery warnings.

## FR-10 SaaS & Billing - Future work (later)

- Tenant plans and feature limits (contacts/campaigns/operators).
- Manual payment flow for Bangladesh methods:
  - bKash, Nagad, Rocket, Bank Asia, Islami Bank
- User submits transaction reference + screenshot.
- Admin verifies and activates subscription manually.
- Billing ledger + audit log.
- Superadmin stats: MRR-like summary, active tenants, churn flags.

---

## 6) Non-Functional Requirements (NFRs)

- **Performance:** 10k+ contacts import with progress feedback.
- **Reliability:** Campaign recovery after app/browser interruption.
- **Security:** At-rest encryption for local DB/backups; signed session tokens.
- **Privacy:** No cloud storage of customer message/call content by default.
- **Localization:** Bangla + English UI and content support.
- **Auditability:** Immutable action logs for sends/calls/status changes.
- **Usability:** <3 clicks from template selection to campaign start.
- **Compatibility:** Modern Chromium browsers + Android 10+ base app target.

---

## 7) Compliance, Legal & Policy Notes (Critical)

- Must comply with Bangladesh telecom and marketing consent regulations.
- Must provide opt-out handling strategy for promotional messaging.
- WhatsApp automation must follow official WhatsApp Business policies.
- User must acknowledge legal responsibility before first campaign run.
- Add “Do Not Contact (DNC)” list management in v1.1 or v1 if possible.

---

## 8) High-Level Architecture

## 8.1 Repositories/Folders

- `quick-call-n-sms/mobile-app` → Android app (Kotlin preferred)
- `quick-call-n-sms/web-app` → Next.js + TypeScript + Tailwind CSS + ShadCN UI

## 8.2 Suggested Technical Stack

### Web App

- Next.js (App Router)
- Tailwind CSS + component library (e.g., shadcn/ui)
- Local-first storage abstraction (IndexedDB + encrypted local cache)
- Optional server layer for SaaS metadata only (no customer PII pOstgreSQL Neon - future work)

### Mobile App

- Kotlin + Android SDK
- Dual-SIM management
- SMSManager / Telephony APIs
- Call state listener + audio playback pipeline
- Local API/socket service for LAN communication with web app
- By default the android engine will work in background and everything visible will show on the browser (web)

### Sync Layer

- QR-based key exchange
- WebSocket over local network (or fallback WebRTC data channel)
- End-to-end payload encryption (session key)

### Reporting

- CSV generation
- PDF renderer (print layouts)
- Local file persistence

---

## 9) Data Model (Conceptual)

- **Tenant**
- **User**
- **DevicePairSession**
- **Contact**
- **ContactImportJob**
- **Campaign**
- **CampaignRecipient**
- **MessageTemplate**
- **CallAudioAsset**
- **DeliveryEvent**
- **CallEvent**
- **Report**
- **PaymentSubmission**
- **SubscriptionPlan**
- **AuditLog**
- **DNCEntry**

Key indexes:

- normalized_phone
- campaign_id + status
- tenant_id + created_at

---

## 10) UX Requirements

- Clear separation:
  - Contacts
  - Campaigns
  - Live Monitor
  - Reports
  - Billing
  - Settings
- Progressive disclosure for advanced options.
- Must show warnings before large bulk sends/calls.
- Show exact failed reasons and retry CTA.
- Bangla-friendly font rendering and input compatibility.

---

## 11) Milestones (Suggested)

### Phase 1 (MVP)

- CSV import (ABS + Google)
- Dedup engine
- QR pairing
- SMS bulk + 1:1
- Status tracking
- Report export (CSV/PDF)
- Retry failed

### Phase 2

- Broadcast call engine
- Audio validation/playback improvements
- Pause/resume campaign

### Phase 3

- SaaS multi-tenant
- Manual payment verification panel
- Superadmin analytics

### Phase 4

- Optional WhatsApp integration (policy-compliant path) - future work (later)
- DNC and consent workflow hardening

---

## 12) Risks & Mitigation

- **Android background restrictions** → foreground service + battery optimization guidance. (Take all required permissions)
- **SIM/Carrier variability** → device compatibility matrix + fallback retry strategy.
- **WhatsApp compliance risk** → keep behind feature flag + official API-first design.
- **Data-loss risk** → encrypted automatic local snapshots + restore tests.
- **Legal spam risk** → consent logs + DNC list + rate limiting.

---

## 13) Acceptance Criteria (MVP)

1. Import 5,000+ contacts from ABS CSV with <2% parse failure (excluding bad rows).
2. Dedup removes duplicates by normalized mobile number.
3. User can send Bangla SMS to all selected contacts in one campaign.
4. Per-recipient statuses visible and filterable.
5. Failed recipients can be retried with one action.
6. Reports exportable to CSV and printable PDF.
7. QR pairing works from web-to-mobile and remains logged in until manual logout/interruption.
8. No customer contact/message payload stored in cloud services by default config.
9. Local backup and restore successfully recreate contacts and reports.

---

## 14) Project Structure (As Requested)

```text
quick-call-n-sms/
  mobile-app/
  web-app/
```

Suggested expansion:

```text
quick-call-n-sms/
  mobile-app/
    app/
    docs/
  web-app/
    app/
    components/
    lib/
    prisma-or-db/
  docs/
    PRD.md
    ARCHITECTURE.md
    API_CONTRACT.md
```

---

## 15) Open Questions (Need Your Confirmation)

1. **Android scope:** App only, or app + accessibility automation for WhatsApp fallback?
2. **Minimum Android version** you want to support?
3. **Expected max daily volume** (SMS count / call count)?
4. **Do you need campaign scheduling** (future date/time) in MVP?
5. **Consent model:** Do you already have customer marketing consent from ABS onboarding?
6. **DNC policy:** Should users be able to opt out by SMS keyword (e.g., STOP)?
7. **Report retention period:** forever or configurable (e.g., 12 months)?
8. **Team size/roles:** how many operators per tenant?
9. **SaaS pricing model:** monthly plan only, or per-message/call pack?
10. **Language in UI:** Bangla only, English only, or bilingual toggle?
11. **Offline mode:** Should web app keep queue when mobile disconnects and auto-resume?
12. **Security preference:** PIN lock on mobile app + optional biometric?

---

## 16) Implementation Note for Copilot-Driven Build

Use this PRD as source-of-truth and generate:

1. `ARCHITECTURE.md`
2. `ROADMAP.md`
3. `TASKS_MVP.md` (granular tickets)
4. API contracts between `web-app` and `mobile-app` (local socket/WebSocket schema)

Recommended first coding sprint:

- Bootstrap Next.js UI shell
- Build CSV import + ded up module
- Create Android pairing + local heartbeat
- Implement SMS queue and status events end-to-end
