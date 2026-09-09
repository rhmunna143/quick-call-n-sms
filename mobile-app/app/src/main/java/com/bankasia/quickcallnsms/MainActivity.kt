package com.bankasia.quickcallnsms

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanIntentResult
import com.journeyapps.barcodescanner.ScanOptions

class MainActivity : AppCompatActivity() {

    private val PERMISSIONS_REQUEST_CODE = 100
    private lateinit var statusText: TextView

    private val barcodeLauncher = registerForActivityResult(ScanContract()) { result: ScanIntentResult ->
        if (result.contents == null) {
            Toast.makeText(this, "Cancelled", Toast.LENGTH_LONG).show()
        } else {
            Toast.makeText(this, "Scanned!", Toast.LENGTH_SHORT).show()
            startLocalEngineService()
            statusText.text = "Paired! Service Running.\nMy IP: ${getLocalIpAddress()}\n\nEnter this IP in your Web App settings!"
        }
    }

    private fun getLocalIpAddress(): String {
        try {
            val wifiManager = applicationContext.getSystemService(android.content.Context.WIFI_SERVICE) as android.net.wifi.WifiManager
            val ipAddress = wifiManager.connectionInfo.ipAddress
            return String.format(
                "%d.%d.%d.%d",
                ipAddress and 0xff,
                ipAddress shr 8 and 0xff,
                ipAddress shr 16 and 0xff,
                ipAddress shr 24 and 0xff
            )
        } catch (e: Exception) {
            return "Unknown"
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusText = findViewById(R.id.statusText)
        val startServiceBtn = findViewById<Button>(R.id.startServiceBtn)

        startServiceBtn.text = "Scan QR to Start Engine"

        startServiceBtn.setOnClickListener {
            if (checkPermissions()) {
                val options = ScanOptions()
                options.setDesiredBarcodeFormats(ScanOptions.QR_CODE)
                options.setPrompt("Scan the QR code from Web App")
                options.setCameraId(0)
                options.setBeepEnabled(false)
                options.setBarcodeImageEnabled(false)
                barcodeLauncher.launch(options)
            } else {
                requestPermissions()
            }
        }
    }

    private fun checkPermissions(): Boolean {
        val permissions = arrayOf(
            Manifest.permission.SEND_SMS,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.CAMERA
        )
        for (p in permissions) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                return false
            }
        }
        return true
    }

    private fun requestPermissions() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(
                Manifest.permission.SEND_SMS,
                Manifest.permission.CALL_PHONE,
                Manifest.permission.READ_PHONE_STATE,
                Manifest.permission.CAMERA
            ),
            PERMISSIONS_REQUEST_CODE
        )
    }

    private fun startLocalEngineService() {
        val serviceIntent = Intent(this, LocalEngineService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }
}
