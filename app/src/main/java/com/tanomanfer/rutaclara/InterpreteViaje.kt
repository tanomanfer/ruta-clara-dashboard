package com.tanomanfer.rutaclara

// EL "CEREBRO" — toma las lineas que leyo el OCR de la pantalla de Uber
// y saca: cuanto paga, cuantos km, cuantos minutos y a donde va el viaje.
// Despues decide el color del semaforo segun la config del chofer.
//
// Validado contra capturas reales de Uber Argentina (UberX y UberX Exclusivo).
// Formato de Uber AR:
//   Tarifa  -> "ARS4,671"  (la coma es separador de MILES -> 4671 pesos)
//   Viaje   -> "Viaje: 15 min (5.0 km)"  (el punto es DECIMAL -> 5.0 km)
//   Destino -> la linea que viene justo despues de la de "Viaje:"
//
// DECISION DE PRODUCTO (24/08/2026): la rentabilidad se calcula SOLO sobre
// el viaje (no se cuenta la ida a buscar al pasajero "A X min (Y km)").

data class Viaje(
    val pesos: Double,
    val kmViaje: Double,
    val minViaje: Double,
    val destino: String?
)

// Resultado ya evaluado: el valor, la unidad y el color del semaforo.
enum class ColorSemaforo { VERDE, AMBAR, ROJO }

data class Evaluacion(
    val valor: Double,          // $/km o $/hora, segun el criterio
    val unidad: String,         // "/km" o "/hora"
    val color: ColorSemaforo,
    val estado: String          // "CONVIENE" / "OJO" / "NO CONVIENE"
)

object InterpreteViaje {

    private data class DatosViaje(
        val linea: LineaTexto,
        val indice: Int,
        val minutos: Double,
        val km: Double
    )

    private data class DatosTarifa(
        val linea: LineaTexto,
        val pesos: Double
    )

    private data class Tarjeta(
        val viaje: DatosViaje,
        val tarifa: DatosTarifa,
        val tieneBotonAceptar: Boolean
    )

    // Toma las lineas del OCR y arma el Viaje. Devuelve null si no encontro
    // lo minimo indispensable (tarifa + km + minutos del viaje).
    fun interpretar(lineas: List<LineaTexto>): Viaje? {
        val regexTarifa = Regex("""(?:A?RS)\s*([\d.,]+)""", RegexOption.IGNORE_CASE)
        val regexViaje = Regex(
            """Viaje:\s*(\d+)\s*min\s*\(\s*([\d.,]+)\s*km\)""",
            RegexOption.IGNORE_CASE
        )

        val viajes = lineas.mapIndexedNotNull { indice, linea ->
            val match = regexViaje.find(linea.texto) ?: return@mapIndexedNotNull null
            val minutos = match.groupValues[1].toDoubleOrNull() ?: return@mapIndexedNotNull null
            val km = match.groupValues[2].replace(",", ".").toDoubleOrNull()
                ?: return@mapIndexedNotNull null
            if (minutos <= 0.0 || km <= 0.0) return@mapIndexedNotNull null
            DatosViaje(linea, indice, minutos, km)
        }

        val tarifas = lineas.mapNotNull { linea ->
            val match = regexTarifa.find(linea.texto) ?: return@mapNotNull null

            // Uber también muestra bonos como "+ARS563 por inicio de..." cerca
            // de la tarjeta. Ese importe NO es la tarifa del viaje y nunca debe
            // alimentar el semáforo. Si aún no apareció la tarifa real, es más
            // seguro devolver null y esperar la siguiente lectura del OCR.
            val textoAntesDeTarifa = linea.texto.substring(0, match.range.first).trimEnd()
            if (textoAntesDeTarifa.endsWith("+")) return@mapNotNull null

            val numero = match.groupValues[1]
            val cantidadDigitos = numero.count(Char::isDigit)
            val pesos = numero.replace(".", "").replace(",", "").toDoubleOrNull()
                ?: return@mapNotNull null

            // Si el OCR leyó solo "ARS 7" o "ARS 0.00", es más seguro no
            // mostrar nada que inventar un rojo con una tarifa incompleta.
            if (cantidadDigitos < 3 || pesos < 100.0) return@mapNotNull null
            DatosTarifa(linea, pesos)
        }

        // Armamos tarjetas: cada "Viaje:" se une únicamente con una tarifa que
        // esté arriba y alineada horizontalmente. Así no se mezclan el saldo,
        // promociones o adicionales del mapa con la solicitud que está adelante.
        val tarjetas = viajes.mapNotNull { viaje ->
            val tarifa = tarifas
                .filter { estaArribaYAlineada(it.linea, viaje.linea) }
                .minByOrNull { costoCercania(it.linea, viaje.linea) }
                ?: return@mapNotNull null

            val tieneAceptar = lineas.any { linea ->
                linea.texto.contains("Aceptar", ignoreCase = true) &&
                    estaDebajoYAlineada(linea, viaje.linea)
            }
            Tarjeta(viaje, tarifa, tieneAceptar)
        }

        // La tarjeta de adelante es la que tiene acción para aceptar y, entre
        // varias opciones visibles, la de mayor escala en pantalla.
        val tarjetaActiva = tarjetas.maxWithOrNull(
            compareBy<Tarjeta> { if (it.tieneBotonAceptar) 1 else 0 }
                .thenBy { altura(it.tarifa.linea) }
                .thenBy { altura(it.viaje.linea) }
        ) ?: return null

        val destino = lineas
            .drop(tarjetaActiva.viaje.indice + 1)
            .asSequence()
            .takeWhile { linea ->
                !linea.texto.contains("Aceptar", ignoreCase = true) &&
                    estaDebajoYAlineada(linea, tarjetaActiva.viaje.linea) &&
                    pareceLineaDeDireccion(linea.texto)
            }
            .take(3)
            .joinToString(" ") { it.texto.trim() }
            .ifBlank { null }

        return Viaje(
            pesos = tarjetaActiva.tarifa.pesos,
            kmViaje = tarjetaActiva.viaje.km,
            minViaje = tarjetaActiva.viaje.minutos,
            destino = destino
        )
    }

    private fun estaArribaYAlineada(tarifa: LineaTexto, viaje: LineaTexto): Boolean {
        if (centroY(tarifa) >= centroY(viaje)) return false
        return estanAlineadas(tarifa, viaje)
    }

    private fun estaDebajoYAlineada(linea: LineaTexto, viaje: LineaTexto): Boolean {
        if (centroY(linea) <= centroY(viaje)) return false
        return estanAlineadas(linea, viaje)
    }

    private fun pareceLineaDeDireccion(texto: String): Boolean {
        val limpio = texto.trim()
        if (limpio.none(Char::isLetter)) return false
        return listOf(
            "Viaje:",
            "Viaje disponible",
            "UberX",
            "Exclusivo",
            "Identidad digital",
            "Evaluación de seguridad"
        ).none { limpio.contains(it, ignoreCase = true) }
    }

    private fun estanAlineadas(a: LineaTexto, b: LineaTexto): Boolean {
        val seSuperponen = minOf(a.x2, b.x2) >= maxOf(a.x1, b.x1)
        if (seSuperponen) return true

        val anchoReferencia = maxOf(ancho(a), ancho(b)).coerceAtLeast(1)
        return kotlin.math.abs(centroX(a) - centroX(b)) <= anchoReferencia * 0.45
    }

    private fun costoCercania(tarifa: LineaTexto, viaje: LineaTexto): Double {
        val distanciaVertical = (viaje.y1 - tarifa.y2).coerceAtLeast(0)
        val distanciaHorizontal = kotlin.math.abs(centroX(tarifa) - centroX(viaje))
        return distanciaVertical + distanciaHorizontal * 2.0
    }

    private fun ancho(linea: LineaTexto): Int = (linea.x2 - linea.x1).coerceAtLeast(1)
    private fun altura(linea: LineaTexto): Int = (linea.y2 - linea.y1).coerceAtLeast(1)
    private fun centroX(linea: LineaTexto): Double = (linea.x1 + linea.x2) / 2.0
    private fun centroY(linea: LineaTexto): Double = (linea.y1 + linea.y2) / 2.0

    // Con el viaje ya interpretado y la config del chofer, decide el semaforo.
    // criterio = "km" o "hora" | objetivo = el numero que el chofer configuro.
    fun evaluar(viaje: Viaje, criterio: String, objetivo: Double): Evaluacion {
        val valor: Double
        val unidad: String
        if (criterio == "km") {
            valor = viaje.pesos / viaje.kmViaje          // $/km
            unidad = "/km"
        } else {
            valor = viaje.pesos / (viaje.minViaje / 60.0) // $/hora
            unidad = "/hora"
        }

        val porcentaje = valor / objetivo
        val color: ColorSemaforo
        val estado: String
        when {
            porcentaje >= 1.0 -> { color = ColorSemaforo.VERDE; estado = "CONVIENE" }
            porcentaje >= 0.9 -> { color = ColorSemaforo.AMBAR; estado = "OJO" }
            else -> { color = ColorSemaforo.ROJO; estado = "NO CONVIENE" }
        }
        return Evaluacion(valor, unidad, color, estado)
    }
}
