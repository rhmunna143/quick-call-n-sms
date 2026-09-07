# MVP Tasks (Granular Tickets)

## Sprint 1: Foundation & Import
- [ ] **WEB-01**: Initialize Next.js project with Tailwind and shadcn/ui.
- [ ] **WEB-02**: Setup Dexie.js for IndexedDB. Define schema for Contacts, Campaigns, Logs.
- [ ] **WEB-03**: Create CSV import component (Papaparse) handling ABS and Google CSV formats.
- [ ] **WEB-04**: Build Deduplication engine (normalize BD phone numbers, merge or skip duplicates).
- [ ] **MOB-01**: Initialize Android Kotlin project with Ktor local server.
- [ ] **MOB-02**: Add required Android permissions (SMS, Contacts).

## Sprint 2: Connectivity & Pairing
- [ ] **WEB-05**: Create QR code generator component in web app containing local IP and token.
- [ ] **MOB-03**: Add QR Scanner to mobile app to read configuration.
- [ ] **MOB-04**: Implement Ktor endpoints for `/ping` (heartbeat).
- [ ] **WEB-06**: Build pairing UI to show connection status and active device.

## Sprint 3: SMS Engine
- [ ] **WEB-07**: Build Campaign Wizard UI (Select Audience -> Compose SMS -> Select SIM -> Execute).
- [ ] **MOB-05**: Implement `/sms/send` endpoint in Ktor to trigger `SmsManager`.
- [ ] **MOB-06**: Implement Android BroadcastReceiver to track SMS Sent/Delivered intents.
- [ ] **MOB-07**: Implement `/events` (WebSocket or Server-Sent Events) to push SMS status updates back to Web App.
- [ ] **WEB-08**: Build Live Dashboard to receive SMS statuses and update IndexedDB.

## Sprint 4: Reporting & Polish
- [ ] **WEB-09**: Create Campaign Report UI (List recipients, success/failure status).
- [ ] **WEB-10**: Add CSV Export functionality for reports.
- [ ] **WEB-11**: Add "Retry Failed" button that generates a new sub-campaign targeting failed numbers.
