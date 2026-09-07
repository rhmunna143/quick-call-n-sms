# Architecture Document

## High-Level Overview

Quick Call & SMS is a privacy-first, local-first system combining a Next.js frontend with an Android Kotlin background service.

### 1. Web App (`web-app/`)
**Role**: UI, data processing, reporting, and campaign management.
**Tech Stack**:
- Framework: Next.js (App Router)
- UI: Tailwind CSS + shadcn/ui
- Storage: Dexie.js (IndexedDB) for local-first data persistence
- Network: Local network polling or WebSocket server (via Node.js local proxy or direct Next.js API routes) for Android communication.

### 2. Mobile App (`mobile-app/`)
**Role**: Execution engine for SMS and Broadcast Calls.
**Tech Stack**:
- Language: Kotlin
- Core APIs: `SmsManager`, Telephony, Audio Playback
- Service: Foreground service to run actions reliably without being killed by Android's Doze mode.
- Server: Local HTTP server (e.g., Ktor) running on the device to expose endpoints for the web app to trigger SMS and calls, or a WebSocket client connecting to the web app's server.

## System Interaction

1. **Pairing**: Web app shows a QR code with the local IP and a session token. Mobile app scans it.
2. **Local Sync Tunnel**: 
   - Option A: Mobile App runs a local HTTP/WebSocket server. Web app connects to `http://<mobile-ip>:<port>`.
   - Option B: Web App acts as the server. Mobile App connects to Web App's IP. 
   - *Decision*: Since Next.js is running locally on the user's machine, Next.js can host a simple API or WebSocket. Alternatively, Ktor on Android is robust. We will proceed with Ktor server on Android, which Next.js will call.

## Data Storage Strategy
- No cloud storage for customer PII.
- All customer lists, campaigns, and logs are stored in IndexedDB (browser).
- Android app acts as a dumb terminal, receiving commands and sending status updates back. It does not store campaigns.
