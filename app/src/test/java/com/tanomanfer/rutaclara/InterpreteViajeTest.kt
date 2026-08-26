package com.tanomanfer.rutaclara

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class InterpreteViajeTest {

    @Test
    fun `elige la tarifa de la tarjeta y no el adicional del mapa`() {
        val viaje = InterpreteViaje.interpretar(
            listOf(
                linea("+ARS 950", 230, 150, 520, 230),
                linea("ARS7,784", 80, 700, 700, 860),
                linea("Viaje: 23 min (15.6 km)", 150, 1250, 800, 1320),
                linea("Avenida Gaona 2119", 150, 1360, 800, 1420),
                linea("Aceptar", 100, 1800, 900, 1920),
                linea("ARS 9,700 adicionales por promoción", 170, 2050, 850, 2110)
            )
        )

        assertEquals(7784.0, viaje?.pesos ?: 0.0, 0.0)
        assertEquals(15.6, viaje?.kmViaje ?: 0.0, 0.0)
        assertEquals(23.0, viaje?.minViaje ?: 0.0, 0.0)
    }

    @Test
    fun `ignora bono con signo mas aunque sea el unico importe visible`() {
        val viaje = InterpreteViaje.interpretar(
            listOf(
                linea("+ARS563.00 por inicio de promoción", 200, 600, 850, 680),
                linea("Viaje: 13 min (4.3 km)", 240, 740, 800, 800),
                linea("Juncal 353, Ituzaingo", 240, 820, 800, 880),
                linea("Viaje disponible", 200, 920, 900, 1040)
            )
        )

        assertNull(viaje)
    }

    @Test
    fun `ignora bono cercano y elige la tarifa real`() {
        val viaje = InterpreteViaje.interpretar(
            listOf(
                linea("ARS4,200", 200, 420, 850, 500),
                linea("+ARS563.00 por inicio de promoción", 200, 600, 850, 680),
                linea("Viaje: 13 min (4.3 km)", 240, 740, 800, 800),
                linea("Juncal 353, Ituzaingo", 240, 820, 800, 880),
                linea("Aceptar", 200, 920, 900, 1040)
            )
        )

        assertEquals(4200.0, viaje?.pesos ?: 0.0, 0.0)
        assertEquals(13.0, viaje?.minViaje ?: 0.0, 0.0)
    }

    @Test
    fun `elige la tarjeta de adelante cuando hay otra opcion pequena`() {
        val viaje = InterpreteViaje.interpretar(
            listOf(
                linea("ARS9,100", 810, 200, 1000, 245),
                linea("Viaje: 30 min (20.0 km)", 810, 390, 1030, 420),
                linea("Aceptar", 820, 510, 1020, 545),
                linea("ARS7,784", 80, 700, 700, 860),
                linea("Viaje: 23 min (15.6 km)", 150, 1250, 800, 1320),
                linea("Aceptar", 100, 1800, 900, 1920)
            )
        )

        assertEquals(7784.0, viaje?.pesos ?: 0.0, 0.0)
        assertEquals(15.6, viaje?.kmViaje ?: 0.0, 0.0)
    }

    @Test
    fun `descarta una tarifa cortada en vez de mostrar un color falso`() {
        val viaje = InterpreteViaje.interpretar(
            listOf(
                linea("ARS 7", 80, 700, 700, 860),
                linea("Viaje: 23 min (15.6 km)", 150, 1250, 800, 1320),
                linea("Aceptar", 100, 1800, 900, 1920)
            )
        )

        assertNull(viaje)
    }

    @Test
    fun `acepta que el OCR pierda la A de ARS dentro de la tarjeta`() {
        val viaje = InterpreteViaje.interpretar(
            listOf(
                linea("RS7,784", 80, 700, 700, 860),
                linea("Viaje: 23 min (15.6 km)", 150, 1250, 800, 1320),
                linea("Aceptar", 100, 1800, 900, 1920)
            )
        )

        assertEquals(7784.0, viaje?.pesos ?: 0.0, 0.0)
    }

    @Test
    fun `no mezcla saldo promocion ni miniatura con la tarjeta real`() {
        // Coordenadas basadas en la captura real del error del 25/08.
        val viaje = InterpreteViaje.interpretar(
            listOf(
                linea("ARS 0.00", 363, 146, 681, 212),
                linea("\$20306/hora", 854, 163, 981, 184),
                linea("RS7,784", 807, 334, 964, 371),
                linea("Viaje: 23 min (15.6 km)", 809, 522, 962, 539),
                linea("Aceptar", 871, 609, 930, 624),
                linea("ARS 9,700 adicionales por promoción", 176, 1672, 837, 1723)
            )
        )

        assertEquals(7784.0, viaje?.pesos ?: 0.0, 0.0)
        assertEquals(23.0, viaje?.minViaje ?: 0.0, 0.0)
        assertEquals(15.6, viaje?.kmViaje ?: 0.0, 0.0)
    }

    @Test
    fun `toma inmediatamente el nuevo importe de la tarjeta activa`() {
        val primera = tarjetaActiva("ARS6,402", "Viaje: 21 min (11.3 km)")
        val siguiente = tarjetaActiva("ARS6,353", "Viaje: 21 min (11.3 km)")

        assertEquals(6402.0, InterpreteViaje.interpretar(primera)?.pesos ?: 0.0, 0.0)
        assertEquals(6353.0, InterpreteViaje.interpretar(siguiente)?.pesos ?: 0.0, 0.0)
    }

    @Test
    fun `calcula correctamente verde ambar y rojo por hora`() {
        val verde = InterpreteViaje.evaluar(Viaje(6402.0, 11.3, 21.0, null), "hora", 15000.0)
        val ambar = InterpreteViaje.evaluar(Viaje(4820.0, 9.3, 20.0, null), "hora", 15000.0)
        val rojo = InterpreteViaje.evaluar(Viaje(4000.0, 9.3, 20.0, null), "hora", 15000.0)

        assertEquals(18291.428, verde.valor, 0.001)
        assertEquals(ColorSemaforo.VERDE, verde.color)
        assertEquals(14460.0, ambar.valor, 0.0)
        assertEquals(ColorSemaforo.AMBAR, ambar.color)
        assertEquals(12000.0, rojo.valor, 0.0)
        assertEquals(ColorSemaforo.ROJO, rojo.color)
    }

    @Test
    fun `respeta los limites exactos del semaforo`() {
        val justoVerde = InterpreteViaje.evaluar(Viaje(5000.0, 10.0, 20.0, null), "hora", 15000.0)
        val justoAmbar = InterpreteViaje.evaluar(Viaje(4500.0, 10.0, 20.0, null), "hora", 15000.0)

        assertEquals(ColorSemaforo.VERDE, justoVerde.color)
        assertEquals(ColorSemaforo.AMBAR, justoAmbar.color)
    }

    @Test
    fun `calcula correctamente por kilometro`() {
        val evaluacion = InterpreteViaje.evaluar(
            Viaje(6402.0, 11.3, 21.0, null),
            "km",
            550.0
        )

        assertEquals(566.548, evaluacion.valor, 0.001)
        assertEquals("/km", evaluacion.unidad)
        assertEquals(ColorSemaforo.VERDE, evaluacion.color)
    }

    @Test
    fun `une las lineas del destino final hasta aceptar`() {
        val viaje = InterpreteViaje.interpretar(
            listOf(
                linea("ARS3,400", 80, 300, 700, 420),
                linea("Viaje: 9 min (3.1 km)", 150, 700, 800, 760),
                linea("Lola Mora 285,", 150, 790, 650, 845),
                linea("Ituzaingo", 150, 850, 500, 905),
                linea("Aceptar", 100, 1000, 900, 1120)
            )
        )

        assertEquals("Lola Mora 285, Ituzaingo", viaje?.destino)
    }

    @Test
    fun `elige destino debajo de viaje y no la recogida de arriba`() {
        val viaje = InterpreteViaje.interpretar(
            listOf(
                linea("ARS3,400", 80, 300, 700, 420),
                linea("A 2 min (0.3 km)", 150, 500, 800, 555),
                linea("Intendente Pérez Quintana,", 150, 560, 800, 615),
                linea("Ituzaingo", 150, 620, 500, 675),
                linea("Viaje: 9 min (3.1 km)", 150, 700, 800, 760),
                linea("Lola Mora 285,", 150, 790, 650, 845),
                linea("Ituzaingo", 150, 850, 500, 905),
                linea("Aceptar", 100, 1000, 900, 1120)
            )
        )

        assertEquals("Lola Mora 285, Ituzaingo", viaje?.destino)
    }

    private fun tarjetaActiva(tarifa: String, detalle: String) = listOf(
        linea(tarifa, 80, 700, 700, 860),
        linea(detalle, 150, 1250, 800, 1320),
        linea("Aceptar", 100, 1800, 900, 1920)
    )

    private fun linea(texto: String, x1: Int, y1: Int, x2: Int, y2: Int) =
        LineaTexto(texto, x1, y1, x2, y2)
}
