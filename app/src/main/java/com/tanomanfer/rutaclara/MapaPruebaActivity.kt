package com.tanomanfer.rutaclara

import android.annotation.SuppressLint
import android.net.Uri
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MapaPruebaActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webViewClient = WebViewClient()
        }
        setContentView(webView)

        val destinoGuardado = getSharedPreferences(MainActivity.PREFS, MODE_PRIVATE)
            .getString(MainActivity.KEY_ULTIMO_DESTINO, null)
        val destino = destinoGuardado?.takeIf { it.isNotBlank() }
            ?: "Av. Rivadavia 5400, Caballito, Buenos Aires"
        webView.loadUrl("file:///android_asset/mapa.html?destino=${Uri.encode(destino)}")
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
