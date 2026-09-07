package com.bankasia.quickcallnsms

import android.telecom.Call
import android.telecom.InCallService

class QuickCallInCallService : InCallService() {

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        
        call.registerCallback(object : Call.Callback() {
            override fun onStateChanged(call: Call, state: Int) {
                super.onStateChanged(call, state)
                
                val statusString = when (state) {
                    Call.STATE_DIALING -> "DIALING"
                    Call.STATE_RINGING -> "RINGING"
                    Call.STATE_ACTIVE -> "ANSWERED"
                    Call.STATE_DISCONNECTED -> "FAILED/DISCONNECTED"
                    else -> "UNKNOWN"
                }

                // Assuming we can extract the target phone number from call details
                val handle = call.details.handle
                val phone = handle?.schemeSpecificPart ?: "Unknown"

                val json = """{"type":"CALL_STATUS","data":{"phone":"$phone","status":"$statusString"}}"""
                EventBus.emitEvent(json)

                if (state == Call.STATE_ACTIVE) {
                    // Play audio into the call stream
                    playAnnouncementAudio(call)
                }
            }
        })
    }

    private fun playAnnouncementAudio(call: Call) {
        // TODO: Actual injection of audio into the call stream requires system privileges
        // or routing the speaker output to the microphone depending on device capabilities.
        // As a default dialer, some devices allow injecting audio via AudioManager.
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        // Cleanup resources
    }
}
