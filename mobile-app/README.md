# Mobile App

This directory contains the Android application for the Quick Call & SMS Engine.

## Setup Instructions
1. Open this directory (`mobile-app`) in **Android Studio**.
2. Allow Android Studio to initialize the gradle project and wrapper.
3. Configure it as an Android project (Kotlin).
4. Add the necessary permissions to `AndroidManifest.xml` (SMS, READ_CONTACTS, CALL_PHONE, Internet).
5. Set up a local HTTP server using Ktor to listen for commands from the Next.js `web-app`.
