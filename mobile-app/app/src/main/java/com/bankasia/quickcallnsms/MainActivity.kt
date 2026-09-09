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
                requestDefaultDialer()
            } else {
                requestPermissions()
            }
        }
    }

    private fun requestDefaultDialer() {
        val telecomManager = getSystemService(TELECOM_SERVICE) as android.telecom.TelecomManager
        if (packageName != telecomManager.defaultDialerPackage) {
            val intent = Intent(android.telecom.TelecomManager.ACTION_CHANGE_DEFAULT_DIALER)
                .putExtra(android.telecom.TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME, packageName)
            startActivityForResult(intent, 200)
        } else {
            launchScanner()
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 200) {
            val telecomManager = getSystemService(TELECOM_SERVICE) as android.telecom.TelecomManager
            if (packageName == telecomManager.defaultDialerPackage) {
                launchScanner()
            } else {
                Toast.makeText(this, "Must be Default Dialer to broadcast audio!", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun launchScanner() {
        val options = ScanOptions()
        options.setDesiredBarcodeFormats(ScanOptions.QR_CODE)
        options.setPrompt("Scan the QR code from Web App")
        options.setCameraId(0)
        options.setBeepEnabled(false)
        options.setBarcodeImageEnabled(false)
        barcodeLauncher.launch(options)
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
