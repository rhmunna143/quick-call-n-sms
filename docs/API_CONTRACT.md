# API Contract (Local Network)

This defines the communication between the Web App and the Mobile App.
The Mobile App hosts a local HTTP/WebSocket server (e.g., on port 8080).

## HTTP REST Endpoints

### 1. `GET /ping`
Check if the mobile app is reachable.
**Response**:
```json
{
  "status": "ok",
  "device": "Samsung Galaxy S21",
  "battery": 85
}
```

### 2. `POST /sms/send`
Queue an SMS for sending.
**Request**:
```json
{
  "campaignId": "camp_123",
  "messageId": "msg_001",
  "phoneNumber": "+8801711000000",
  "content": "Hello, this is a test message.",
  "simSlot": 0 
}
```
**Response**:
```json
{
  "status": "queued",
  "messageId": "msg_001"
}
```

## WebSocket Events (`/events`)

The Web App connects to `ws://<mobile-ip>:8080/events` to receive real-time updates.

### Event: `SMS_STATUS_UPDATE`
Sent by the Mobile App when an SMS intent resolves.
```json
{
  "type": "SMS_STATUS_UPDATE",
  "data": {
    "campaignId": "camp_123",
    "messageId": "msg_001",
    "phoneNumber": "+8801711000000",
    "status": "DELIVERED", 
    "errorReason": null
  }
}
```
*Statuses: `SENT`, `DELIVERED`, `FAILED`*
