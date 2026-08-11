<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Reglas del Proyecto "Ruta Clara"

Este archivo define las reglas de desarrollo, diseño y colaboración entre los agentes de IA (Gemini y Claude Code) y el desarrollador (Fernando/Tano).

## 🚀 Stack Tecnológico
- **Frontend**: TanStack Start + TanStack Router + React Query + Tailwind CSS + shadcn/ui + TypeScript.
- **Backend**: Supabase (PostgreSQL + GoTrue Auth + Row Level Security - RLS).

## 🤖 División del Trabajo (80/20)
- **Gemini (este agente)**: Se encarga del **80%** de las tareas:
  - Creación de archivos y estructura inicial.
  - Edición de código y refactorizaciones.
  - Tareas mecánicas e integraciones de componentes.
  - Ajustes de UI y responsive design.
- **Claude Code (Opus)**: Se reserva para el **20%** de complejidad alta:
  - Políticas de seguridad y Row Level Security (RLS) en Supabase.
  - Lógica compleja del backend o del negocio.
  - Debugging delicado o resolución de bugs difíciles.
  - Pruebas unitarias o de integración críticas.

> [!IMPORTANT]
> **Control de RLS y Autenticación**: Si una tarea asignada a Gemini involucra tocar políticas de RLS, autenticación de usuarios o la lógica crítica del cálculo de rentabilidad del negocio, Gemini **deberá advertir al usuario** de que esa tarea debería ser derivada a Claude Code, deteniendo la ejecución hasta recibir confirmación.

## 🛑 Regla de No Automatización (Seguridad del Chofer)
- **Nunca** automatizar la aceptación o rechazo de viajes en las aplicaciones de Uber o DiDi.
- La aplicación es estrictamente de lectura y visualización de información para ayudar en la toma de decisiones. La acción final de aceptar o rechazar un viaje la debe realizar el chofer manualmente.

## 🎨 Guía de Diseño ("Tablero de Auto")
- **Fondo**: Oscuro (Dark mode por defecto).
- **Tipografía y números**: Números grandes, legibles de un vistazo (fuentes monoespaciadas o tabulares para datos).
- **Semáforo de Rentabilidad**:
  - Verde: `#00C853` (Excelente rentabilidad)
  - Ámbar/Amarillo: `#FFB300` (Rentabilidad moderada)
  - Rojo: `#E53935` (Baja rentabilidad / Rechazar)
- **Color de Acento**: Naranja `#FF6B35`.

## 📢 Comunicación y Flujo de Trabajo
- **Español Simple**: El desarrollador (Fernando/Tano) está aprendiendo. Explica todos los cambios técnicos de forma clara y sencilla, evitando tecnicismos innecesarios.
- **Paso a Paso**: Realizar **una tarea a la vez**. Esperar la confirmación y feedback del usuario antes de encadenar la siguiente tarea o avanzar al siguiente paso.
- **Git Control**: **Nunca** realizar `git commit` ni `git push` de forma automática. Siempre se debe pedir permiso y confirmación explícita al desarrollador.
