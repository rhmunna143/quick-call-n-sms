package com.bankasia.quickcallnsms

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

import android.app.PendingIntent
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.flow.collectLatest

import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.server.request.receiveText
import org.json.JSONObject

class LocalEngineService : Service() {

    private val CHANNEL_ID = "LocalEngineServiceChannel"
    private var server: NettyApplicationEngine? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Quick Call Engine")
            .setContentText("Local server is running and listening for commands...")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()

        startForeground(1, notification)

        // Start Ktor Server
        startKtorServer()

        return START_STICKY
    }

    private fun startKtorServer() {
        if (server != null) return

        CoroutineScope(Dispatchers.IO).launch {
            server = embeddedServer(Netty, port = 8080) {
                install(CORS) {
                    anyHost()
                    allowHeader(HttpHeaders.ContentType)
                    allowMethod(HttpMethod.Options)
                    allowMethod(HttpMethod.Get)
                    allowMethod(HttpMethod.Post)
                    allowMethod(HttpMethod.Put)
                    allowMethod(HttpMethod.Delete)
                }
                install(WebSockets)
                
                routing {
                    get("/ping") {
                        call.respondText("{\"status\":\"ok\",\"device\":\"Android Engine\"}")
                    }
                    
                    webSocket("/events") {
                        EventBus.events.collectLatest { eventJson ->
                            send(Frame.Text(eventJson))
                        }
                    }

                    post("/sms/send") {
                        try {
                            val body = call.receiveText()
                            val json = JSONObject(body)
                            val campaignId = json.optInt("campaignId", 1)
                            val phoneNumber = json.optString("phoneNumber")
                            val content = json.optString("content", "Test Message")

                            val smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                applicationContext.getSystemService(android.telephony.SmsManager::class.java)
                            } else {
                                android.telephony.SmsManager.getDefault()
                            }
                            
                            val sentIntent = Intent(SmsBroadcastReceiver.ACTION_SMS_SENT).apply {
                                putExtra(SmsBroadcastReceiver.EXTRA_PHONE, phoneNumber)
                                putExtra(SmsBroadcastReceiver.EXTRA_CAMPAIGN_ID, campaignId)
                                setPackage(packageName)
                            }
                            val sentPi = PendingIntent.getBroadcast(
                                this@LocalEngineService,
                                phoneNumber.hashCode(),
                                sentIntent,
                                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                            )

                            smsManager.sendTextMessage(phoneNumber, null, content, sentPi, null)
                            
                            call.respondText("{\"status\":\"queued\"}")
                        } catch (e: Exception) {
                            call.respondText("{\"status\":\"error\", \"reason\":\"${e.message}\"}")
                        }
                    }
                    post("/call/send") {
                        try {
                            val body = call.receiveText()
                            val json = JSONObject(body)
                            val phoneNumber = json.optString("phoneNumber")
                            val contentB64 = json.optString("content") // This will be "data:audio/mp3;base64,...."
                            
                            // 1. Save audio to disk
                            if (contentB64.isNotEmpty() && contentB64.contains(",")) {
                                val base64Audio = contentB64.substringAfter(",")
                                val audioBytes = android.util.Base64.decode(base64Audio, android.util.Base64.DEFAULT)
                                val file = java.io.File(applicationContext.filesDir, "current_campaign.mp3")
                                file.writeBytes(audioBytes)
                            }

                            // 2. Dial using TelecomManager (Bypasses background restrictions if Default Dialer)
                            val telecomManager = applicationContext.getSystemService(android.content.Context.TELECOM_SERVICE) as android.telecom.TelecomManager
                            val uri = android.net.Uri.parse("tel:${phoneNumber}")
                            val extras = android.os.Bundle().apply {
                                putBoolean(android.telecom.TelecomManager.EXTRA_START_CALL_WITH_SPEAKERPHONE, true)
                            }
                            telecomManager.placeCall(uri, extras)

                            call.respondText("{\"status\":\"call_queued\"}")
                        } catch (e: Exception) {
                            call.respondText("{\"status\":\"error\", \"reason\":\"${e.message}\"}")
                        }
                    }
                }
            }.start(wait = true)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        server?.stop(1000, 2000)
        server = null
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Local Engine Service Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }
}
