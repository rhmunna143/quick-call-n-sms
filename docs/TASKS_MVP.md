# MVP Tasks (Granular Tickets)

## Sprint 1: Foundation & Import
- [x] **WEB-01**: Initialize Next.js project with Tailwind and shadcn/ui.
- [x] **WEB-02**: Setup Dexie.js for IndexedDB. Define schema for Contacts, Campaigns, Logs.
- [x] **WEB-03**: Create CSV import component (Papaparse) handling ABS and Google CSV formats.
- [x] **WEB-04**: Build Deduplication engine (normalize BD phone numbers, merge or skip duplicates).
- [x] **MOB-01**: Initialize Android Kotlin project with Ktor local server.
- [x] **MOB-02**: Add required Android permissions (SMS, Contacts).

## Sprint 2: Connectivity & Pairing
- [x] **WEB-05**: Create QR code generator component in web app containing local IP and token.
- [ ] **MOB-03**: Add QR Scanner to mobile app to read configuration.
- [x] **MOB-04**: Implement Ktor endpoints for `/ping` (heartbeat).
- [ ] **WEB-06**: Build pairing UI to show connection status and active device.

## Sprint 3: SMS Engine
- [x] **WEB-07**: Build Campaign Wizard UI (Select Audience -> Compose SMS -> Select SIM -> Execute).
- [x] **MOB-05**: Implement `/sms/send` endpoint in Ktor to trigger `SmsManager`.
- [ ] **MOB-06**: Implement Android BroadcastReceiver to track SMS Sent/Delivered intents.
- [ ] **MOB-07**: Implement `/events` (WebSocket or Server-Sent Events) to push SMS status updates back to Web App.
- [x] **WEB-08**: Build Live Dashboard to receive SMS statuses and update IndexedDB.

## Sprint 4: Reporting & Polish
- [x] **WEB-09**: Create Campaign Report UI (List recipients, success/failure status).
- [x] **WEB-10**: Add CSV Export functionality for reports.
- [x] **WEB-11**: Add "Retry Failed" button that generates a new sub-campaign targeting failed numbers.
