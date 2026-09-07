package com.bankasia.quickcallnsms

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.SmsManager

class SmsBroadcastReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_SMS_SENT = "com.bankasia.quickcallnsms.SMS_SENT"
        const val ACTION_SMS_DELIVERED = "com.bankasia.quickcallnsms.SMS_DELIVERED"
        const val EXTRA_PHONE = "phone"
        const val EXTRA_CAMPAIGN_ID = "campaignId"
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        val action = intent?.action ?: return
        val phone = intent.getStringExtra(EXTRA_PHONE) ?: "Unknown"
        val campaignId = intent.getIntExtra(EXTRA_CAMPAIGN_ID, -1)

        when (action) {
            ACTION_SMS_SENT -> {
                val status = when (resultCode) {
                    Activity.RESULT_OK -> "SENT"
                    SmsManager.RESULT_ERROR_GENERIC_FAILURE -> "FAILED_GENERIC"
                    SmsManager.RESULT_ERROR_NO_SERVICE -> "FAILED_NO_SERVICE"
                    SmsManager.RESULT_ERROR_NULL_PDU -> "FAILED_NULL_PDU"
                    SmsManager.RESULT_ERROR_RADIO_OFF -> "FAILED_RADIO_OFF"
                    else -> "FAILED_UNKNOWN"
                }
                
                val json = """{"type":"SMS_STATUS","data":{"campaignId":$campaignId,"phone":"$phone","status":"$status"}}"""
                EventBus.emitEvent(json)
            }
            ACTION_SMS_DELIVERED -> {
                val json = """{"type":"SMS_STATUS","data":{"campaignId":$campaignId,"phone":"$phone","status":"DELIVERED"}}"""
                EventBus.emitEvent(json)
            }
        }
    }
}
