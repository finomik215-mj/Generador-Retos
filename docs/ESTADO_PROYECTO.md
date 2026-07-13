# Estado del proyecto — herramienta-retos

_Última actualización: 2026-07-13._

## El modelo (sistema por capas, cerrado e implementado)

El curso se genera con un modelo pedagógico por capas, donde cada capa toma una decisión que la siguiente da por fija (principio rector):

1. **Pedagogía Finomik** — cómo entendemos el aprendizaje. `docs/pedagogia_finomik.md` (constante en `lib/pedagogia.ts`).
2. **Diseño Curricular** (humano) — bloques y subtemas de cada módulo. Tablas `moduls`, `leccions`, `subtemes`.
3. **Planificación** — el arco del módulo + la secuencia de objetivos de aprendizaje. Tabla `planificacions`.
4. **Ficha didáctica** — el brief de enseñanza de cada objetivo. Tabla `fichas`.
5. **Contenido** — la pieza redactada desde la ficha, en 3 idiomas. Tabla `contenido_aprobado`.
6. **Retos** — práctica desde ficha + contenido. Tabla `retos_guardados`.

La unidad atómica es el **objetivo de aprendizaje** (una comprensión, un cambio de mirada). Cada objetivo tiene su pipeline: ficha → contenido → retos.

## La app (UI reorganizada)

Pestañas, en orden de flujo:
- **1 · Estructura** — el árbol del curso y su estado.
- **2 · Disseny del curs** — el flujo guiado: eliges un módulo, generas y apruebas el **Plan**, y cada objetivo se despliega en su pipeline: **1 Fitxa → 2 Contingut (idioma) → 3 Reptes**.
- **Contingut manual / Reptes manual** — herramientas antiguas (fallback).

Cerebros (prompts): `lib/systemPromptPlanificacion.ts`, `systemPromptFicha.ts`, `systemPromptContenido.ts` (acepta ficha), `systemPromptReptes.ts`.
Rutas: `app/api/planificacion/*`, `app/api/ficha/*`, `app/api/contenido/desfitxa`, `app/api/reptes/desfitxa`.

## Estado de validación

- Planificación, Ficha y Contenido-desde-ficha: validados en vivo (resultados excelentes, apoyados en el material real).
- Retos: construido, **pendiente de probar en vivo** desde la app.

## Datos / Supabase (proyecto txyvfrvkdkccolccepbk)

- `materials_referencia`: 5 módulos cargados.
- Tablas nuevas creadas: `planificacions`, `fichas`. (Retos usa `retos_guardados`, ya existente.)
- Seguridad: la app usa la `service_role` en el servidor. Pendiente opcional: `sql/enable_rls.sql` para cerrar el RLS de las tablas abiertas.
- El content-hub de LinkedIn va en OTRO proyecto de Supabase, a propósito.

## Próximo paso

Probar en vivo el flujo completo de un objetivo (ficha → contenido → retos) en "2 · Disseny del curs", y calibrar los prompts si hace falta.
