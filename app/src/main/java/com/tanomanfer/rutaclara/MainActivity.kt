package com.tanomanfer.rutaclara

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    companion object {
        const val PREFS = "ruta_clara_config"
        const val KEY_CRITERIO = "criterio"
        const val KEY_OBJETIVO = "objetivo"
        const val KEY_POSICION = "posicion"   // "arriba_centro" | "arriba_izq" | "arriba_der" | "abajo"
        const val KEY_ULTIMO_DESTINO = "ultimo_destino"
    }

    private lateinit var btnActivarCaptura: Button
    private lateinit var btnProbarCaptura: Button
    private lateinit var labelEstadoCaptura: TextView
    private lateinit var panelEstado: android.widget.LinearLayout
    private lateinit var tvEstadoGrande: TextView
    private lateinit var tvEstadoDetalle: TextView

    private val lanzadorCaptura = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { resultado ->
        val data = resultado.data
        if (resultado.resultCode == RESULT_OK && data != null) {
            ScreenCaptureService.iniciar(this, resultado.resultCode, data)
            btnProbarCaptura.isEnabled = true
            Toast.makeText(this, "¡Listo para trabajar!", Toast.LENGTH_SHORT).show()
            // Damos un instante a que el servicio quede listo y refrescamos el cartel.
            btnActivarCaptura.postDelayed({ actualizarPanelEstado() }, 400)
        } else {
            labelEstadoCaptura.text = "No diste el permiso. Tocá de nuevo para activar."
            actualizarPanelEstado()
        }
    }

    private val lanzadorNotificaciones = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) {
        pedirPermisoCaptura()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val grupoCriterio = findViewById<RadioGroup>(R.id.grupoCriterio)
        val radioKm = findViewById<RadioButton>(R.id.radioKm)
        val radioHora = findViewById<RadioButton>(R.id.radioHora)
        val posArribaCentro = findViewById<RadioButton>(R.id.posArribaCentro)
        val posArribaIzq = findViewById<RadioButton>(R.id.posArribaIzq)
        val posArribaDer = findViewById<RadioButton>(R.id.posArribaDer)
        val posAbajo = findViewById<RadioButton>(R.id.posAbajo)
        val inputObjetivo = findViewById<EditText>(R.id.inputObjetivo)
        val labelObjetivo = findViewById<TextView>(R.id.labelObjetivo)
        val btnGuardar = findViewById<Button>(R.id.btnGuardar)
        val btnVerMapa = findViewById<Button>(R.id.btnVerMapa)
        val labelEstado = findViewById<TextView>(R.id.labelEstado)
        btnActivarCaptura = findViewById(R.id.btnActivarCaptura)
        btnProbarCaptura = findViewById(R.id.btnProbarCaptura)
        labelEstadoCaptura = findViewById(R.id.labelEstadoCaptura)
        panelEstado = findViewById(R.id.panelEstado)
        tvEstadoGrande = findViewById(R.id.tvEstadoGrande)
        tvEstadoDetalle = findViewById(R.id.tvEstadoDetalle)

        val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
        val criterioGuardado = prefs.getString(KEY_CRITERIO, "hora")
        val objetivoGuardado = prefs.getFloat(KEY_OBJETIVO, 0f)
        if (criterioGuardado == "km") {
            radioKm.isChecked = true
            labelObjetivo.text = "En pesos por kilómetro"
        } else {
            radioHora.isChecked = true
            labelObjetivo.text = "En pesos por hora"
        }
        if (objetivoGuardado > 0f) {
            inputObjetivo.setText(objetivoGuardado.toInt().toString())
        }
        // Cargar la posición del semáforo guardada (por defecto: arriba al centro).
        when (prefs.getString(KEY_POSICION, "arriba_centro")) {
            "arriba_izq" -> posArribaIzq.isChecked = true
            "arriba_der" -> posArribaDer.isChecked = true
            "abajo" -> posAbajo.isChecked = true
            else -> posArribaCentro.isChecked = true
        }
        grupoCriterio.setOnCheckedChangeListener { _, checkedId ->
            if (checkedId == R.id.radioKm) {
                labelObjetivo.text = "En pesos por kilómetro"
            } else {
                labelObjetivo.text = "En pesos por hora"
            }
        }
        btnGuardar.setOnClickListener {
            val criterio = if (radioKm.isChecked) "km" else "hora"
            val textoObjetivo = inputObjetivo.text.toString().trim()
            if (textoObjetivo.isEmpty()) {
                Toast.makeText(this, "Ingresá tu objetivo", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val objetivo = textoObjetivo.toFloatOrNull()
            if (objetivo == null || objetivo <= 0f) {
                Toast.makeText(this, "Ingresá un número válido", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val posicion = when {
                posArribaIzq.isChecked -> "arriba_izq"
                posArribaDer.isChecked -> "arriba_der"
                posAbajo.isChecked -> "abajo"
                else -> "arriba_centro"
            }
            prefs.edit()
                .putString(KEY_CRITERIO, criterio)
                .putFloat(KEY_OBJETIVO, objetivo)
                .putString(KEY_POSICION, posicion)
                .apply()
            val unidad = if (criterio == "km") "/km" else "/hora"
            labelEstado.text = "✓ Guardado: \$${objetivo.toInt()}$unidad"
            Toast.makeText(this, "Configuración guardada", Toast.LENGTH_SHORT).show()
        }

        btnVerMapa.setOnClickListener {
            startActivity(Intent(this, MapaPruebaActivity::class.java))
        }

        if (ScreenCaptureService.estaListo()) {
            btnProbarCaptura.isEnabled = true
        }
        // Cartel grande de estado al abrir la app.
        actualizarPanelEstado()

        btnActivarCaptura.setOnClickListener {
            if (ScreenCaptureService.estaListo()) {
                // Ya está activo → APAGAR.
                ScreenCaptureService.detener(this)
                btnProbarCaptura.isEnabled = false
                labelEstadoCaptura.text = ""
                Toast.makeText(this, "App apagada", Toast.LENGTH_SHORT).show()
                // Damos un instante a que el servicio se detenga y refrescamos el cartel.
                btnActivarCaptura.postDelayed({ actualizarPanelEstado() }, 400)
            } else {
                // Está apagado → ACTIVAR (pide permisos si hace falta).
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                    ContextCompat.checkSelfPermission(
                        this, Manifest.permission.POST_NOTIFICATIONS
                    ) != PackageManager.PERMISSION_GRANTED
                ) {
                    lanzadorNotificaciones.launch(Manifest.permission.POST_NOTIFICATIONS)
                } else {
                    pedirPermisoCaptura()
                }
            }
        }

        btnProbarCaptura.setOnClickListener {
            labelEstadoCaptura.text = "Capturando y leyendo..."
            ScreenCaptureService.capturarYLeer { resultado ->
                runOnUiThread {
                    if (resultado == null) {
                        labelEstadoCaptura.text = "No se pudo leer. ¿Activaste la lectura primero?"
                    } else {
                        // NUEVO: ademas de leer, interpretamos la tarjeta de Uber
                        // y decimos si el viaje conviene, usando la config guardada.
                        mostrarResultado(resultado.lineas)
                    }
                }
            }
        }
    }

    // Toma las lineas del OCR, las interpreta con InterpreteViaje y arma el texto
    // que se muestra en pantalla: los datos del viaje + si conviene o no.
    private fun mostrarResultado(lineas: List<LineaTexto>) {
        val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
        val criterio = prefs.getString(KEY_CRITERIO, "hora") ?: "hora"
        val objetivo = prefs.getFloat(KEY_OBJETIVO, 0f).toDouble()

        val viaje = InterpreteViaje.interpretar(lineas)

        if (viaje == null) {
            // No encontro una tarjeta de viaje valida. Muestro lo que leyo, para diagnosticar.
            val muestra = lineas.take(8).joinToString("\n") { "• ${it.texto}" }
            labelEstadoCaptura.text =
                "Leí ${lineas.size} líneas pero no encontré un viaje.\n" +
                "¿Estaba la tarjeta de Uber en pantalla?\n\n$muestra"
            return
        }

        if (objetivo <= 0.0) {
            labelEstadoCaptura.text =
                "Leí el viaje (\$${viaje.pesos.toInt()}, ${viaje.kmViaje} km, " +
                "${viaje.minViaje.toInt()} min) pero primero configurá y guardá tu objetivo arriba."
            return
        }

        val ev = InterpreteViaje.evaluar(viaje, criterio, objetivo)
        val emoji = when (ev.color) {
            ColorSemaforo.VERDE -> "🟢"
            ColorSemaforo.AMBAR -> "🟡"
            ColorSemaforo.ROJO -> "🔴"
        }

        labelEstadoCaptura.text = buildString {
            append("$emoji ${ev.estado}\n")
            append("$${ev.valor.toInt()}${ev.unidad}\n\n")
            append("Tarifa: $${viaje.pesos.toInt()}\n")
            append("Viaje: ${viaje.minViaje.toInt()} min (${viaje.kmViaje} km)\n")
            if (viaje.destino != null) append("Destino: ${viaje.destino}")
        }
    }

    // Cada vez que se vuelve a la app, refrescamos el cartel de estado
    // (por si se activó/desactivó la lectura desde otro lado).
    override fun onResume() {
        super.onResume()
        actualizarPanelEstado()
    }

    // Pinta el cartel grande de arriba según si la app está lista para trabajar.
    // Verde = lectura activada (listo). Rojo = falta activar.
    private fun actualizarPanelEstado() {
        val listo = ScreenCaptureService.estaListo()
        // Limpiamos el mensaje chico para que no queden textos viejos contradictorios.
        labelEstadoCaptura.text = ""
        if (listo) {
            panelEstado.setBackgroundColor(0xFF10361A.toInt())   // verde oscuro
            tvEstadoGrande.text = "🟢 LISTO PARA TRABAJAR"
            tvEstadoDetalle.text = "La app va a mostrar el semáforo sola cuando entre un viaje.\nTocá el botón rojo para apagarla."
            btnActivarCaptura.text = "APAGAR"
            btnActivarCaptura.backgroundTintList =
                android.content.res.ColorStateList.valueOf(0xFFE53935.toInt())  // rojo
            btnProbarCaptura.isEnabled = true
        } else {
            panelEstado.setBackgroundColor(0xFF3A1212.toInt())   // rojo oscuro
            tvEstadoGrande.text = "🔴 APAGADO"
            tvEstadoDetalle.text = "Tocá el botón verde para empezar a trabajar."
            btnActivarCaptura.text = "ACTIVAR PARA TRABAJAR"
            btnActivarCaptura.backgroundTintList =
                android.content.res.ColorStateList.valueOf(0xFF00C853.toInt())  // verde
            btnProbarCaptura.isEnabled = false
        }
    }

    private fun pedirPermisoCaptura() {
        val manager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        lanzadorCaptura.launch(manager.createScreenCaptureIntent())
    }
}
