package com.tanomanfer.rutaclara

import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions

// Una linea de texto encontrada en la pantalla, con su posicion.
// La posicion es clave: mas adelante nos dice cual numero es la tarifa,
// cual la distancia, y donde esta el destino dentro de la tarjeta de Uber.
data class LineaTexto(
    val texto: String,
    val x1: Int,
    val y1: Int,
    val x2: Int,
    val y2: Int
)

data class ResultadoLectura(val lineas: List<LineaTexto>)

class ScreenCaptureService : Service() {

    companion object {
        private const val TAG = "ScreenCaptureService"
        private const val CHANNEL_ID = "ruta_clara_captura"
        private const val NOTIF_ID = 1001

        private const val EXTRA_RESULT_CODE = "resultCode"
        private const val EXTRA_DATA = "data"

        // OJO: Activity.RESULT_OK vale -1, asi que NO se puede usar -1 como
        // valor por defecto de "no vino nada". Por eso usamos MIN_VALUE.
        private const val SIN_RESULTADO = Int.MIN_VALUE

        private const val INTENTOS_CAPTURA = 6
        private const val ESPERA_ENTRE_INTENTOS_MS = 120L

        @Volatile
        private var instancia: ScreenCaptureService? = null

        fun iniciar(context: Context, resultCode: Int, data: Intent) {
            val intent = Intent(context, ScreenCaptureService::class.java).apply {
                putExtra(EXTRA_RESULT_CODE, resultCode)
                putExtra(EXTRA_DATA, data)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun detener(context: Context) {
            context.stopService(Intent(context, ScreenCaptureService::class.java))
        }

        fun estaListo(): Boolean = instancia?.mediaProjection != null

        // Saca una captura y la pasa directamente a ML Kit. No se guarda un PNG
        // en cada lectura porque eso demoraba el semaforo y llenaba almacenamiento.
        fun capturarYLeer(onResultado: (ResultadoLectura?) -> Unit) {
            val servicio = instancia
            if (servicio == null || servicio.mediaProjection == null) {
                Log.w(TAG, "capturarYLeer: el servicio no esta activo todavia")
                onResultado(null)
                return
            }
            servicio.capturarFrame { bitmap ->
                if (bitmap == null) {
                    onResultado(null)
                    return@capturarFrame
                }
                servicio.leerTexto(bitmap) { lineas ->
                    bitmap.recycle()
                    if (lineas == null) {
                        onResultado(null)
                    } else {
                        onResultado(ResultadoLectura(lineas))
                    }
                }
            }
        }
    }

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var anchoPantalla = 0
    private var altoPantalla = 0
    private val handler = Handler(Looper.getMainLooper())
    // Crear ML Kit una sola vez evita pagar el costo de inicializacion en cada viaje.
    private val reconocedorTexto = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    override fun onCreate() {
        super.onCreate()
        instancia = this
        crearCanalNotificacion()
        Log.d(TAG, "onCreate: servicio creado")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIF_ID,
                crearNotificacion(),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            )
        } else {
            startForeground(NOTIF_ID, crearNotificacion())
        }

        val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, SIN_RESULTADO) ?: SIN_RESULTADO
        val data = obtenerDataParcelable(intent)

        Log.d(TAG, "onStartCommand: resultCode=$resultCode hayData=${data != null} yaHabiaProyeccion=${mediaProjection != null}")

        if (resultCode == Activity.RESULT_OK && data != null && mediaProjection == null) {
            iniciarProyeccion(resultCode, data)
        }

        return START_STICKY
    }

    private fun obtenerDataParcelable(intent: Intent?): Intent? {
        if (intent == null) return null
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(EXTRA_DATA, Intent::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(EXTRA_DATA)
        }
    }

    private fun iniciarProyeccion(resultCode: Int, data: Intent) {
        try {
            val manager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            val projection = manager.getMediaProjection(resultCode, data)
            if (projection == null) {
                Log.e(TAG, "getMediaProjection devolvio null")
                return
            }
            mediaProjection = projection

            projection.registerCallback(object : MediaProjection.Callback() {
                override fun onStop() {
                    Log.d(TAG, "MediaProjection detenido")
                    virtualDisplay?.release()
                    imageReader?.close()
                    virtualDisplay = null
                    imageReader = null
                    mediaProjection = null
                }
            }, handler)

            val metrics = DisplayMetrics()
            val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
            @Suppress("DEPRECATION")
            wm.defaultDisplay.getRealMetrics(metrics)
            anchoPantalla = metrics.widthPixels
            altoPantalla = metrics.heightPixels

            val reader = ImageReader.newInstance(anchoPantalla, altoPantalla, PixelFormat.RGBA_8888, 2)
            imageReader = reader

            virtualDisplay = projection.createVirtualDisplay(
                "RutaClaraCaptura",
                anchoPantalla, altoPantalla, metrics.densityDpi,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                reader.surface, null, handler
            )

            Log.d(TAG, "MediaProjection LISTO: ${anchoPantalla}x${altoPantalla}")
        } catch (e: Exception) {
            Log.e(TAG, "Error iniciando la proyeccion", e)
        }
    }

    // ML Kit: lee todo el texto de la imagen, on-device, sin mandar nada a internet.
    private fun leerTexto(bitmap: Bitmap, onResultado: (List<LineaTexto>?) -> Unit) {
        try {
            val imagen = InputImage.fromBitmap(bitmap, 0)
            reconocedorTexto.process(imagen)
                .addOnSuccessListener { resultado ->
                    val lineas = mutableListOf<LineaTexto>()
                    for (bloque in resultado.textBlocks) {
                        for (linea in bloque.lines) {
                            val caja = linea.boundingBox
                            lineas.add(
                                LineaTexto(
                                    texto = linea.text,
                                    x1 = caja?.left ?: 0,
                                    y1 = caja?.top ?: 0,
                                    x2 = caja?.right ?: 0,
                                    y2 = caja?.bottom ?: 0
                                )
                            )
                        }
                    }
                    // El detalle de cada linea generaba cientos de mensajes por minuto.
                    // Para diagnostico alcanza con saber cuantas lineas se encontraron.
                    Log.d(TAG, "OCR: ${lineas.size} lineas encontradas")
                    onResultado(lineas)
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Error de OCR", e)
                    onResultado(null)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Excepcion armando el OCR", e)
            onResultado(null)
        }
    }

    private fun capturarFrame(onResultado: (Bitmap?) -> Unit) {
        intentarCapturar(INTENTOS_CAPTURA, onResultado)
    }

    private fun intentarCapturar(intentosRestantes: Int, onResultado: (Bitmap?) -> Unit) {
        val reader = imageReader
        if (reader == null) {
            Log.w(TAG, "intentarCapturar: no hay imageReader")
            onResultado(null)
            return
        }
        val image = reader.acquireLatestImage()
        if (image == null) {
            if (intentosRestantes > 1) {
                Log.d(TAG, "Todavia no hay frame, reintento (quedan ${intentosRestantes - 1})")
                handler.postDelayed({ intentarCapturar(intentosRestantes - 1, onResultado) }, ESPERA_ENTRE_INTENTOS_MS)
            } else {
                Log.w(TAG, "No llego ningun frame despues de varios intentos")
                onResultado(null)
            }
            return
        }
        try {
            val plane = image.planes[0]
            val buffer = plane.buffer
            val pixelStride = plane.pixelStride
            val rowStride = plane.rowStride
            val rowPadding = rowStride - pixelStride * anchoPantalla

            val bitmapCrudo = Bitmap.createBitmap(
                anchoPantalla + rowPadding / pixelStride,
                altoPantalla,
                Bitmap.Config.ARGB_8888
            )
            bitmapCrudo.copyPixelsFromBuffer(buffer)

            val bitmapFinal = Bitmap.createBitmap(bitmapCrudo, 0, 0, anchoPantalla, altoPantalla)
            bitmapCrudo.recycle()

            onResultado(bitmapFinal)
        } catch (e: Exception) {
            Log.e(TAG, "Error armando el bitmap", e)
            onResultado(null)
        } finally {
            image.close()
        }
    }

    private fun crearCanalNotificacion() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val canal = NotificationChannel(
                CHANNEL_ID,
                "Ruta Clara - Lectura de viajes",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(canal)
        }
    }

    private fun crearNotificacion(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Ruta Clara")
            .setContentText("Leyendo viajes en pantalla")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        virtualDisplay?.release()
        imageReader?.close()
        mediaProjection?.stop()
        reconocedorTexto.close()
        instancia = null
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
