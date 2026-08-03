# ESTADO_PROYECTO

## Última actualización
2026-08-03

## Para otra IA que retome esto (Antigravity u otra)
Ruta Clara: app para choferes de Uber/DiDi en Argentina que calcula rentabilidad por viaje ($/km o $/hora, criterio elegido por el chofer) y muestra un semáforo verde/ámbar/rojo, con mapa de zonas de riesgo como diferencial. Stack: TanStack Start + React Query + Tailwind + shadcn/ui + Supabase (Postgres + Auth + RLS). Repo: tanomanfer/ruta-clara-dashboard. 80% del trabajo mecánico va a Gemini (Antigravity); Claude Code (Opus) se reserva para schema/RLS/auth. Etapa: dogfooding con Tano y un amigo. Todavía no hay pipeline real de datos (Accessibility Service Android, Fase 4, no empezada) — todo lo cargado hoy es manual.

## Qué se hizo (acumulado)
- Auth real, landing pública con leads.
- Módulo 1: objetivos reales en /setup + selector de criterio ($/km o $/hora, columna criterio_evaluacion).
- Módulo 2: /home real (ganancia y promedios de hoy desde Supabase).
- Módulo 3: /history real.
- Módulo 4: /registrar-viaje, formulario manual para cargar viajes de prueba (calcula rentabilidad y estado según criterio; amarillo = 90% del objetivo).
- Fase 2: mapa automático (Leaflet) en /trip-mobile y /trip-tablet, visible en verde/ámbar, oculto en rojo.
- Fase 3: tabla zonas (motivo: inseguridad/calle_rota/otro, compartido boolean) + pantalla /zonas con mapa interactivo (clic mueve marcador candidato, doble clic fija y guarda). Zonas reales ya conectadas al mapa de /trip-mobile y /trip-tablet.

## Qué falta / próximos pasos
- Botón de recentrar ubicación en /zonas.
- Destino en trip-mobile/trip-tablet sigue siendo de ejemplo (Obelisco) hasta Fase 4.
- Fase 4 (Android nativo, Accessibility Service): no empezada.

## Decisiones tomadas (no repreguntar)
- Sin cálculo de combustible en el MVP.
- Un solo criterio de evaluación por chofer, nunca los dos a la vez.
- Mapa: Google Maps para navegación real (link externo), OpenStreetMap/Leaflet para vista embebida (gratis, sin API key).
- Nunca mencionar Uber/DiDi/Waze/Accessibility Service en contenido público.

## Notas / bloqueos
- Ninguno por el momento.
