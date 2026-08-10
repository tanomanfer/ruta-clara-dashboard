package com.tanomanfer.rutaclara

import android.accessibilityservice.AccessibilityService
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.TextView

class RutaClaraAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "RutaClaraService"

        // Colores del semáforo (los mismos de la app web)
        private const val COLOR_VERDE = 0xFF00C853.toInt()
        private const val COLOR_AMBAR = 0xFFFFB300.toInt()
        private const val COLOR_ROJO = 0xFFE53935.toInt()

        // Tiempo mínimo entre lecturas para no procesar el evento duplicado (en milisegundos)
        private const val ANTI_REBOTE_MS = 1000L
    }

    private var windowManager: WindowManager? = null
    private var floatingView: View? = null

    // Marca de tiempo de la última vez que procesamos un viaje
    private var ultimaLecturaMs: Long = 0

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val root: AccessibilityNodeInfo = rootInActiveWindow ?: return

        val tarifa = root.findAccessibilityNodeInfosByViewId("com.tanomanfer.mockuber:id/tvTarifa")
        val distancia = root.findAccessibilityNodeInfosByViewId("com.tanomanfer.mockuber:id/tvDistancia")
        val tiempo = root.findAccessibilityNodeInfosByViewId("com.tanomanfer.mockuber:id/tvTiempo")

        if (tarifa.isNotEmpty() && distancia.isNotEmpty() && tiempo.isNotEmpty()) {

            // Anti-rebote: ignoramos lecturas pegadas (evento duplicado del sistema)
            val ahora = System.currentTimeMillis()
            if (ahora - ultimaLecturaMs < ANTI_REBOTE_MS) {
                root.recycle()
                return
            }
            ultimaLecturaMs = ahora

            val tarifaTexto = tarifa[0].text?.toString() ?: return
            val distanciaTexto = distancia[0].text?.toString() ?: return
            val tiempoTexto = tiempo[0].text?.toString() ?: return

            val pesos = extraerNumero(tarifaTexto)
            val km = extraerNumero(distanciaTexto)
            val minutos = extraerNumero(tiempoTexto)

            if (pesos != null && km != null && minutos != null && km > 0 && minutos > 0) {
                // Leer la configuración que el chofer guardó en la pantalla de ajustes
                val prefs = getSharedPreferences(MainActivity.PREFS, MODE_PRIVATE)
                val criterio = prefs.getString(MainActivity.KEY_CRITERIO, "hora") ?: "hora"
                val objetivo = prefs.getFloat(MainActivity.KEY_OBJETIVO, 0f).toDouble()

                // Si todavía no configuró nada, no mostramos semáforo
                if (objetivo <= 0.0) {
                    Log.d(TAG, "Sin objetivo configurado, no muestro semáforo")
                    root.recycle()
                    return
                }

                val valor: Double
                val unidad: String
                if (criterio == "hora") {
                    valor = pesos / (minutos / 60.0)   // $/hora
                    unidad = "/hora"
                } else {
                    valor = pesos / km                  // $/km
                    unidad = "/km"
                }

                Log.d(TAG, "Criterio: $criterio | Valor: $valor$unidad (objetivo: $objetivo)")
                mostrarSemaforo(valor, objetivo, unidad)
            }
        }

        root.recycle()
    }

    // Saca el número de textos tipo "$5.900", "Distancia: 8.2 km" o "Tiempo estimado: 14 min"
    // Maneja el formato argentino: punto de miles vs punto/coma decimal.
    private fun extraerNumero(texto: String): Double? {
        val match = Regex("[\\d.,]+").find(texto) ?: return null
        var numero = match.value

        if (numero.contains(",")) {
            numero = numero.replace(".", "").replace(",", ".")
        } else {
            val idx = numero.lastIndexOf(".")
            if (idx != -1) {
                val decimales = numero.length - idx - 1
                numero = if (decimales == 3) {
                    numero.replace(".", "")
                } else {
                    numero
                }
            }
        }

        return numero.toDoubleOrNull()
    }

    private fun mostrarSemaforo(valor: Double, objetivo: Double, unidad: String) {
        quitarSemaforo()

        val wm = windowManager ?: (getSystemService(WINDOW_SERVICE) as WindowManager).also {
            windowManager = it
        }

        val view = LayoutInflater.from(this).inflate(R.layout.floating_semaphore, null)
        floatingView = view

        // Decidir color y estado según el objetivo
        val porcentaje = valor / objetivo
        val color: Int
        val estado: String
        when {
            porcentaje >= 1.0 -> { color = COLOR_VERDE; estado = "CONVIENE" }
            porcentaje >= 0.9 -> { color = COLOR_AMBAR; estado = "OJO" }
            else -> { color = COLOR_ROJO; estado = "NO CONVIENE" }
        }

        // Pintar el círculo del color correspondiente
        val circulo = view.findViewById<View>(R.id.circuloSemaforo)
        (circulo.background as? GradientDrawable)?.setColor(color)

        // Texto: dato grande + estado
        val tvDato = view.findViewById<TextView>(R.id.tvDatoClave)
        val tvEstado = view.findViewById<TextView>(R.id.tvEstado)
        tvDato.text = "$${valor.toInt()}$unidad"
        tvEstado.text = estado
        tvEstado.setTextColor(color)

        val tipoVentana = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            tipoVentana,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )
        params.gravity = Gravity.BOTTOM or Gravity.END
        params.x = 20
        params.y = 40

        wm.addView(view, params)

        view.postDelayed({ quitarSemaforo() }, 8000)
    }

    private fun quitarSemaforo() {
        floatingView?.let {
            windowManager?.removeView(it)
            floatingView = null
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "Servicio interrumpido")
    }

    override fun onDestroy() {
        super.onDestroy()
        quitarSemaforo()
    }
}