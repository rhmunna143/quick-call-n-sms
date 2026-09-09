package com.bankasia.quickcallnsms

import android.content.Context
import android.media.AudioManager
import android.media.MediaPlayer
import android.telecom.Call
import android.telecom.InCallService
import java.io.File

class QuickCallInCallService : InCallService() {

    private var mediaPlayer: MediaPlayer? = null

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
        try {
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            audioManager.isSpeakerphoneOn = true
            audioManager.mode = AudioManager.MODE_IN_CALL

            val file = File(applicationContext.filesDir, "current_campaign.mp3")
            if (file.exists()) {
                mediaPlayer = MediaPlayer().apply {
                    setDataSource(file.absolutePath)
                    setAudioStreamType(AudioManager.STREAM_VOICE_CALL)
                    prepare()
                    start()
                    
                    setOnCompletionListener {
                        // Hang up the call when audio finishes!
                        call.disconnect()
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
