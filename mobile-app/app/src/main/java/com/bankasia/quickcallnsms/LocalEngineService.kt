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
                install(WebSockets)
                routing {
                    get("/ping") {
                        call.respondText("{\"status\":\"ok\",\"device\":\"Android Engine\"}")
                    }
                    
                    webSocket("/events") {
                        // Subscribe to EventBus and send to connected clients
                        EventBus.events.collectLatest { eventJson ->
                            send(Frame.Text(eventJson))
                        }
                    }

                    post("/sms/send") {
                        try {
                            // Dummy parsing for now, in real life we parse JSON
                            // val campaignId = requestBody.campaignId
                            // val phoneNumber = requestBody.phoneNumber
                            val campaignId = 1
                            val phoneNumber = "+880123456789"
                            val content = "Test Message"

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
                            // In a real app we parse JSON to get phoneNumber and audioUrl.
                            // val body = call.receive<CallRequest>()
                            
                            // Simulate starting an intent to dial
                            // val intent = Intent(Intent.ACTION_CALL)
                            // intent.data = Uri.parse("tel:${body.phoneNumber}")
                            // intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            // applicationContext.startActivity(intent)
                            
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
