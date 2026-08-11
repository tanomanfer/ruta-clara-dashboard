# Ruta Clara

App para choferes de Uber/DiDi en Argentina que calcula la rentabilidad de cada viaje y muestra un semáforo de colores (verde/ámbar/rojo) para ayudar a decidir si conviene aceptarlo.

## Stack

- Frontend: TanStack Start + TanStack Router + React Query + Tailwind + shadcn/ui + TypeScript.
- Backend: Supabase (Postgres + Auth + RLS).

## Reglas de seguridad y alcance

- Nunca automatizar el toque de "Aceptar" o "Rechazar" viajes en Uber/DiDi. La app solo lee y muestra información: la decisión final siempre la toma el chofer manualmente en la app original.
- Todas las tablas de Supabase deben tener Row Level Security (RLS) activada. Cada chofer solo puede ver y modificar sus propios datos (perfiles y viajes).

## Diseño

Concepto "tablero de auto":
- Fondo oscuro, números grandes y tabulares.
- Colores de semáforo real: verde `#00C853`, ámbar `#FFB300`, rojo `#E53935`.
- Acento naranja: `#FF6B35`.

## Rendimiento

Prioridad absoluta: el semáforo debe aparecer y leerse en menos de 1 segundo en el modo celular, donde compite con el timer de aceptación de Uber/DiDi (10-15 seg).

## Cómo trabajar en este proyecto

- Antes de cualquier cambio grande de arquitectura o de las policies de RLS, avisar y explicar el porqué en términos simples, ya que el desarrollador está aprendiendo.
- Nunca hacer commit ni push sin confirmación explícita del usuario.
