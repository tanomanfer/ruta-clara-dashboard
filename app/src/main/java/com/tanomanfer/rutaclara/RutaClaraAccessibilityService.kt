package com.tanomanfer.rutaclara

import android.accessibilityservice.AccessibilityService
import android.annotation.SuppressLint
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.webkit.WebView
import android.webkit.WebViewClient

// VIGÍA AUTOMÁTICO (versión OCR-first + diagnóstico)
// Mientras el chofer está en Uber, este servicio dispara la captura de pantalla
// cada cierto tiempo. El OCR lee TODO el texto de la pantalla (aunque Uber no lo
// exponga por accesibilidad) y InterpreteViaje decide si hay una tarjeta de viaje.
// Si hay viaje, muestra el semáforo. Todo SOLO, sin que el chofer toque nada.

class RutaClaraAccessibilityService : AccessibilityService() {
    companion object {
        private const val TAG = "RutaClaraService"
        private const val COLOR_VERDE = 0xFF00C853.toInt()
        private const val COLOR_AMBAR = 0xFFFFB300.toInt()
        private const val COLOR_ROJO = 0xFFE53935.toInt()

        // Dejamos que Uber termine de dibujar la tarjeta, pero arrancamos casi al
        // instante. El OCR en sí ya limita naturalmente la frecuencia.
        private const val DEMORA_TRAS_EVENTO_MS = 80L
        // Una vez que hay una oferta, seguimos leyéndola aunque Uber quede quieto.
        // Así el semáforo dura exactamente lo que dura la tarjeta visible.
        private const val INTERVALO_SEGUIMIENTO_MS = 700L
        // Si dejamos de confirmar la tarjeta durante este tiempo, cerramos el
        // semáforo por seguridad. Mientras la tarjeta siga presente, cada lectura
        // renueva esta vigencia y el cartel permanece visible.
        private const val VIGENCIA_SIN_CONFIRMACION_MS = 6000L
        private const val VIGENCIA_MAPA_EXPANDIDO_MS = 20000L
        // Una lectura aislada puede fallar mientras Uber anima o cambia tarjetas.
        private const val LECTURAS_VACIAS_PARA_CERRAR = 2
        // Si la misma lectura reaparece enseguida, sigue siendo la misma oferta.
        private const val VENTANA_MISMA_OFERTA_MS = 5000L
        // Paquetes de Uber (conductor y, por las dudas, el genérico).
        private val PAQUETES_UBER = listOf("com.ubercab.driver", "com.ubercab")
    }

    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private val handler = Handler(Looper.getMainLooper())

    private var capturaEnCurso = false
    private var capturaPendiente = false
    private var capturaProgramadaParaMs = 0L
    private var ultimaHuellaViaje: String? = null
    private var ultimaLecturaValidaMs: Long = 0
    private var lecturasVaciasConsecutivas = 0
    private var mapaExpandido = false
    private var destinoMapaActual: String? = null

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val paquete = event.packageName?.toString() ?: return
        val esUber = PAQUETES_UBER.contains(paquete) || paquete.contains("uber", ignoreCase = true)
        if (!esUber) return

        // DIAGNÓSTICO: dejamos constancia de que estamos viendo Uber en pantalla.
        Log.d(TAG, "Evento en Uber (paquete=$paquete). Evaluando si capturar...")

        if (capturaEnCurso) {
            // Si la tarjeta cambia durante el OCR, no perdemos ese aviso: apenas
            // termina la lectura actual hacemos otra con la pantalla ya dibujada.
            capturaPendiente = true
            return
        }
        programarCaptura(DEMORA_TRAS_EVENTO_MS)
    }

    private val runnableCaptura = Runnable {
        capturaProgramadaParaMs = 0L
        if (capturaEnCurso) {
            capturaPendiente = true
        } else {
            capturaEnCurso = true
            dispararCaptura()
        }
    }

    // Mantiene la captura más próxima ya programada. Un evento nuevo puede
    // adelantar el seguimiento, pero una ráfaga de eventos no crea capturas dobles.
    private fun programarCaptura(demoraMs: Long) {
        val ahora = SystemClock.uptimeMillis()
        val paraMs = ahora + demoraMs
        if (capturaProgramadaParaMs != 0L && capturaProgramadaParaMs <= paraMs) return
        handler.removeCallbacks(runnableCaptura)
        capturaProgramadaParaMs = paraMs
        handler.postDelayed(runnableCaptura, demoraMs)
    }

    private fun dispararCaptura() {
        if (!ScreenCaptureService.estaListo()) {
            Log.w(TAG, "Lectura de pantalla NO activada (falta permiso de captura). Abrí RutaClara y tocá 'Activar captura'.")
            capturaEnCurso = false
            return
        }
        Log.d(TAG, "Disparando captura OCR sobre Uber...")
        ScreenCaptureService.capturarYLeer { resultado ->
            handler.post {
                if (resultado == null) {
                    Log.w(TAG, "La captura/OCR no devolvió nada")
                } else {
                    Log.d(TAG, "OCR devolvió ${resultado.lineas.size} líneas")
                    procesarLineas(resultado.lineas)
                }
                finalizarCaptura()
            }
        }
    }

    private fun finalizarCaptura() {
        capturaEnCurso = false
        when {
            capturaPendiente -> {
                capturaPendiente = false
                programarCaptura(0L)
            }
            floatingView != null -> programarCaptura(INTERVALO_SEGUIMIENTO_MS)
        }
    }

    private fun procesarLineas(lineas: List<LineaTexto>) {
        val viaje = InterpreteViaje.interpretar(lineas)
        if (viaje == null) {
            if (mapaExpandido) {
                Log.d(TAG, "Mapa ampliado: ignoro lectura vacía para que el chofer pueda decidir")
                return
            }
            lecturasVaciasConsecutivas++
            // Una sola lectura vacía puede ser una animación de Uber. Esperamos una
            // segunda para que el cartel no parpadee ni vuelva a aparecer repetido.
            if (lecturasVaciasConsecutivas >= LECTURAS_VACIAS_PARA_CERRAR && floatingView != null) {
                Log.d(TAG, "Ya no hay tarjeta activa → borro el semáforo")
                quitarSemaforo()
            }
            return
        }

        viaje.destino?.takeIf { it.isNotBlank() }?.let { getSharedPreferences(MainActivity.PREFS, MODE_PRIVATE).edit().putString(MainActivity.KEY_ULTIMO_DESTINO, it).apply() }

        lecturasVaciasConsecutivas = 0
        val huella = "${viaje.pesos}|${viaje.kmViaje}|${viaje.minViaje}"
        val ahora = System.currentTimeMillis()
        val mismaOfertaReciente = huella == ultimaHuellaViaje &&
            ahora - ultimaLecturaValidaMs <= VENTANA_MISMA_OFERTA_MS
        ultimaLecturaValidaMs = ahora

        // Mientras la oferta de adelante no cambie no repetimos el semáforo, aunque
        // una animación haya producido una lectura vacía. Si cambia cualquier dato,
        // la huella cambia y el cartel se reemplaza inmediatamente.
        if (mismaOfertaReciente && floatingView != null) {
            actualizarDestinoDelMapa(viaje.destino)
            renovarVigenciaSemaforo()
            Log.d(TAG, "Misma oferta activa, no repito")
            return
        }
        ultimaHuellaViaje = huella

        val prefs = getSharedPreferences(MainActivity.PREFS, MODE_PRIVATE)
        val criterio = prefs.getString(MainActivity.KEY_CRITERIO, "hora") ?: "hora"
        val objetivo = prefs.getFloat(MainActivity.KEY_OBJETIVO, 0f).toDouble()
        if (objetivo <= 0.0) {
            Log.d(TAG, "Sin objetivo configurado, no muestro semáforo")
            return
        }

        val ev = InterpreteViaje.evaluar(viaje, criterio, objetivo)
        val color = when (ev.color) {
            ColorSemaforo.VERDE -> COLOR_VERDE
            ColorSemaforo.AMBAR -> COLOR_AMBAR
            ColorSemaforo.ROJO -> COLOR_ROJO
        }
        Log.d(TAG, "VIAJE OK: \$${viaje.pesos.toInt()} ${viaje.kmViaje}km ${viaje.minViaje.toInt()}min -> ${ev.valor.toInt()}${ev.unidad} ${ev.estado}")
        mostrarSemaforo(ev.valor, ev.unidad, ev.estado, color, viaje.destino)
    }

    // Si dejamos de recibir confirmaciones válidas, quitamos el semáforo para que
    // nunca quede un color viejo cuando Uber ya retiró la tarjeta.
    private val runnableQuitar = Runnable { quitarSemaforo() }
    private val runnableQuitarMapaExpandido = Runnable { quitarSemaforo() }

    @SuppressLint("SetJavaScriptEnabled", "ClickableViewAccessibility")
    private fun mostrarSemaforo(
        valor: Double,
        unidad: String,
        estado: String,
        color: Int,
        destino: String?
    ) {
        // Cancelamos la vigencia del semáforo anterior y lo reemplazamos.
        handler.removeCallbacks(runnableQuitar)
        quitarSemaforo()
        val wm = windowManager ?: (getSystemService(WINDOW_SERVICE) as WindowManager).also {
            windowManager = it
        }
        val view = LayoutInflater.from(this).inflate(R.layout.floating_semaphore, null)
        floatingView = view

        val circulo = view.findViewById<View>(R.id.circuloSemaforo)
        (circulo.background as? GradientDrawable)?.setColor(color)

        val tvDato = view.findViewById<TextView>(R.id.tvDatoClave)
        val tvEstado = view.findViewById<TextView>(R.id.tvEstado)
        tvDato.text = "$${valor.toInt()}$unidad"
        tvEstado.text = estado
        tvEstado.setTextColor(color)

        val root = view.findViewById<LinearLayout>(R.id.floatingRoot)
        val panelSemaforo = view.findViewById<LinearLayout>(R.id.panelSemaforo)
        val contenedorMapa = view.findViewById<FrameLayout>(R.id.contenedorMapa)
        val miniMapa = view.findViewById<WebView>(R.id.miniMapa)
        val capaAbrirMapa = view.findViewById<View>(R.id.capaAbrirMapa)
        val btnMinimizarMapa = view.findViewById<Button>(R.id.btnMinimizarMapa)
        val destinoMapa = destino?.takeIf { it.isNotBlank() }
        if (destinoMapa == null) {
            contenedorMapa.visibility = View.GONE
        } else {
            destinoMapaActual = destinoMapa
            miniMapa.settings.javaScriptEnabled = true
            miniMapa.settings.domStorageEnabled = true
            miniMapa.webViewClient = WebViewClient()
            miniMapa.loadUrl("file:///android_asset/mapa.html?destino=${Uri.encode(destinoMapa)}")
        }

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
        // Ubicación según lo que el chofer eligió en la configuración.
        // El margen es proporcional al alto/ancho de pantalla (bien en celu y tablet).
        val metrics = resources.displayMetrics
        val margenV = (metrics.heightPixels * 0.06).toInt()
        val margenH = (metrics.widthPixels * 0.04).toInt()
        val prefsPos = getSharedPreferences(MainActivity.PREFS, MODE_PRIVATE)
        fun aplicarPosicionConfigurada() {
            when (prefsPos.getString(MainActivity.KEY_POSICION, "arriba_centro")) {
                "arriba_izq" -> {
                    params.gravity = Gravity.TOP or Gravity.START
                    params.x = margenH; params.y = margenV
                }
                "arriba_der" -> {
                    params.gravity = Gravity.TOP or Gravity.END
                    params.x = margenH; params.y = margenV
                }
                "abajo" -> {
                    params.gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
                    params.x = 0; params.y = margenV
                }
                else -> {
                    params.gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
                    params.x = 0; params.y = margenV
                }
            }
        }
        aplicarPosicionConfigurada()

        val densidad = metrics.density
        fun dp(valor: Int): Int = (valor * densidad).toInt()
        val anchoExpandido = minOf(metrics.widthPixels - dp(32), dp(320))
        val altoExpandido = minOf((metrics.heightPixels * 0.34).toInt(), dp(300))

        fun renovarVigenciaMapaExpandido() {
            handler.removeCallbacks(runnableQuitarMapaExpandido)
            handler.postDelayed(runnableQuitarMapaExpandido, VIGENCIA_MAPA_EXPANDIDO_MS)
        }

        capaAbrirMapa.setOnClickListener {
            mapaExpandido = true
            handler.removeCallbacks(runnableQuitar)
            renovarVigenciaMapaExpandido()
            root.orientation = LinearLayout.VERTICAL
            root.gravity = Gravity.CENTER_HORIZONTAL
            contenedorMapa.layoutParams = LinearLayout.LayoutParams(
                anchoExpandido,
                altoExpandido
            ).apply { topMargin = dp(10) }
            capaAbrirMapa.visibility = View.GONE
            btnMinimizarMapa.visibility = View.VISIBLE
            params.gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            params.x = 0
            params.y = margenV
            wm.updateViewLayout(view, params)
            miniMapa.post { miniMapa.evaluateJavascript("mapa.invalidateSize();", null) }
        }

        btnMinimizarMapa.setOnClickListener {
            mapaExpandido = false
            handler.removeCallbacks(runnableQuitarMapaExpandido)
            root.orientation = LinearLayout.VERTICAL
            root.gravity = Gravity.CENTER_HORIZONTAL
            contenedorMapa.layoutParams = LinearLayout.LayoutParams(dp(180), dp(90)).apply {
                topMargin = dp(8)
            }
            btnMinimizarMapa.visibility = View.GONE
            capaAbrirMapa.visibility = View.VISIBLE
            aplicarPosicionConfigurada()
            wm.updateViewLayout(view, params)
            miniMapa.post { miniMapa.evaluateJavascript("mapa.invalidateSize();", null) }
            renovarVigenciaSemaforo()
        }

        miniMapa.setOnTouchListener { _, evento ->
            if (mapaExpandido && evento.actionMasked == MotionEvent.ACTION_DOWN) {
                renovarVigenciaMapaExpandido()
            }
            false
        }

        var inicioDeslizamientoX = 0f
        panelSemaforo.setOnTouchListener { panel, evento ->
            when (evento.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    inicioDeslizamientoX = evento.rawX
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (evento.rawX - inicioDeslizamientoX >= dp(80)) {
                        quitarSemaforo()
                    } else {
                        panel.performClick()
                    }
                    true
                }
                else -> true
            }
        }

        wm.addView(view, params)
        renovarVigenciaSemaforo()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun actualizarDestinoDelMapa(destino: String?) {
        val destinoNuevo = destino?.takeIf { it.isNotBlank() } ?: return
        if (destinoNuevo == destinoMapaActual) return
        val view = floatingView ?: return
        val contenedorMapa = view.findViewById<FrameLayout>(R.id.contenedorMapa)
        val miniMapa = view.findViewById<WebView>(R.id.miniMapa)
        miniMapa.settings.javaScriptEnabled = true
        miniMapa.settings.domStorageEnabled = true
        miniMapa.webViewClient = WebViewClient()
        miniMapa.loadUrl("file:///android_asset/mapa.html?destino=${Uri.encode(destinoNuevo)}")
        contenedorMapa.visibility = View.VISIBLE
        destinoMapaActual = destinoNuevo
        Log.d(TAG, "Destino completado en lectura posterior → actualizo mini-mapa")
    }

    private fun renovarVigenciaSemaforo() {
        handler.removeCallbacks(runnableQuitar)
        if (mapaExpandido) return
        handler.postDelayed(runnableQuitar, VIGENCIA_SIN_CONFIRMACION_MS)
    }

    private fun quitarSemaforo() {
        mapaExpandido = false
        destinoMapaActual = null
        handler.removeCallbacks(runnableQuitarMapaExpandido)
        floatingView?.let {
            it.findViewById<WebView>(R.id.miniMapa)?.destroy()
            windowManager?.removeView(it)
            floatingView = null
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "Servicio interrumpido")
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(runnableCaptura)
        handler.removeCallbacks(runnableQuitar)
        handler.removeCallbacks(runnableQuitarMapaExpandido)
        quitarSemaforo()
    }
}
