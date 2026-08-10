package com.tanomanfer.rutaclara

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    companion object {
        // Nombre del "cajón" donde guardamos la configuración en el celular
        const val PREFS = "ruta_clara_config"
        const val KEY_CRITERIO = "criterio"   // "km" o "hora"
        const val KEY_OBJETIVO = "objetivo"   // el número
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val grupoCriterio = findViewById<RadioGroup>(R.id.grupoCriterio)
        val radioKm = findViewById<RadioButton>(R.id.radioKm)
        val radioHora = findViewById<RadioButton>(R.id.radioHora)
        val inputObjetivo = findViewById<EditText>(R.id.inputObjetivo)
        val labelObjetivo = findViewById<TextView>(R.id.labelObjetivo)
        val btnGuardar = findViewById<Button>(R.id.btnGuardar)
        val labelEstado = findViewById<TextView>(R.id.labelEstado)

        val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)

        // Cargar lo que ya estaba guardado (si hay algo)
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

        // Cambiar el texto de ayuda según el criterio elegido
        grupoCriterio.setOnCheckedChangeListener { _, checkedId ->
            if (checkedId == R.id.radioKm) {
                labelObjetivo.text = "En pesos por kilómetro"
            } else {
                labelObjetivo.text = "En pesos por hora"
            }
        }

        // Botón guardar
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

            // Guardar en el celular
            prefs.edit()
                .putString(KEY_CRITERIO, criterio)
                .putFloat(KEY_OBJETIVO, objetivo)
                .apply()

            val unidad = if (criterio == "km") "/km" else "/hora"
            labelEstado.text = "✓ Guardado: \$${objetivo.toInt()}$unidad"
            Toast.makeText(this, "Configuración guardada", Toast.LENGTH_SHORT).show()
        }
    }
}