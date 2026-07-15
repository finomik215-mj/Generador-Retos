# Repartidor de conceptos — Diseño

## Problema

El contenido de las piezas lo escribe ChatGPT (fuera de la app) pieza a pieza, sin
memoria de las demás. Como un mismo alumno puede ver varios módulos y muchos temas
son parecidos, se repiten conceptos: el mismo concepto se explica desde cero en más
de una pieza. El índice del curso no basta: reparte por título de subtema, no por
concepto, que es donde se cuela la repetición.

El contenido generado NO vuelve a la app (se copia a otro sitio), así que la única
palanca es el **brief** que la app produce por cada pieza.

## Objetivo

Que cada concepto del curso se explique desde cero en UNA sola pieza (su "dueña").
Cuando reaparece en otra pieza, esa pieza solo lo profundiza o lo enlaza en una
frase, sin re-explicarlo. Esto respeta la "espiral" de la pedagogía Finomik.

## Alcance

- Cubre 5 módulos: Vida Adulta, Introducción a la Inversión, Emprendimiento,
  Economía 1º de Bachillerato, Economía 4º de ESO.
- **Excluye el Módulo General**, que se construirá al final a partir de los demás.
- El reparto trabaja a nivel de **subtema** (la estructura), no de objetivo del plan.
  Así el mapa no depende de tener los módulos planificados y solo se regenera si
  cambia la estructura (bloques/subtemas), no cada vez que se regenera un plan.

## Modelo conceptual

Un paso de IA lee todos los subtemas de los 5 módulos, en orden de curso
(module.ordre, luego leccion.ordre, luego subtema.ordre), y produce un **mapa de
conceptos**: la lista de conceptos que aparecen en más de una pieza. Cada concepto:

- **dueño:** la primera pieza del curso (en ese orden) que lo necesita. Ahí se
  explica desde cero.
- **reapariciones:** las demás piezas donde vuelve a salir. Ahí no se re-explica.

El "orden de curso" define quién es el dueño: siempre la aparición más temprana.

## Componentes

### 1. Almacenamiento — tabla `mapa_conceptos`
Una sola fila para todo el curso.
- `id` (pk fija, p.ej. texto 'curso')
- `ledger` jsonb — el mapa completo (ver forma abajo)
- `estado` text ('propuesto' | 'aprobado')
- `updated_at` timestamptz
RLS activado, sin políticas (solo service key desde el servidor), como las demás.

Forma de `ledger` (array):
```json
[
  {
    "concepto": "interés compuesto",
    "duenyo": { "modulo": "...", "bloque": "...", "subtema": "..." },
    "reapariciones": [ { "modulo": "...", "bloque": "...", "subtema": "..." } ]
  }
]
```

### 2. Cerebro — `lib/systemPromptMapaConceptos.ts`
- Tipos `ConceptoReparto`, `MapaConceptos`.
- `getSystemPromptMapaConceptos()`: instruye a la IA para detectar conceptos
  recurrentes (los que aparecen en 2+ subtemas), asignar dueño = primera aparición
  en el orden dado, listar reapariciones, y devolver SOLO JSON con el esquema.
  Reglas: copiar nombres de módulo/bloque/subtema exactos; no inventar conceptos que
  no estén en los subtemas; concisión; sin guion largo.

### 3. Rutas de API — `app/api/mapa/{generar,guardar,obtener}/route.ts`
- `generar` (POST): lee leccions+subtemes de los 5 módulos (excluye Módulo General),
  ordena por module.ordre/leccion.ordre/subtema.ordre, construye el user message con
  la lista ordenada, llama al modelo (`claude-sonnet-4-6`, `maxDuration=60`,
  max_tokens amplio por si el ledger es largo), parsea JSON, devuelve `MapaConceptos`.
  No escribe en DB.
- `guardar` (POST): upsert de la fila única con `estado`.
- `obtener` (GET): devuelve la fila (maybeSingle).

### 4. UI — botón a nivel de curso en `PlanificacioView`
En el panel lateral (aside), junto a "Copiar índex del curs": un bloque
**"Mapa de conceptos"** con:
- estado (generado/aprobado/sin generar),
- botón "Generar mapa de conceptos" / "Regenerar",
- botones Desar/Aprovar.
El ledger se carga al montar (como `indexCurs`) y se guarda en estado del componente.

### 5. Cambio en el brief — `buildBrief`
- Se **elimina** el volcado del índice completo del curso del brief.
- Se añade una sección **REPARTO DE CONCEPTOS**, calculada en cliente desde el ledger
  para el subtema de la pieza actual:
  - *Defines aquí (dueño):* conceptos cuyo `duenyo` es este subtema.
  - *NO definas aquí (de otras piezas):* conceptos donde este subtema está en
    `reapariciones` (con puntero al dueño). Regla: usarlos solo con una frase.
- Si no hay ledger o el módulo no tiene conceptos mapeados, la sección se omite.
- La regla "escribes para quien lo oye por primera vez" se mantiene.

### 6. Guía del GPT — `docs/guia_contenido_chatgpt.md`
Actualizar la sección de coherencia y el punto 8 para describir la sección REPARTO
DE CONCEPTOS en lugar del índice incrustado.

## Flujo de uso

1. El usuario finaliza la estructura de los módulos.
2. Pulsa "Generar mapa de conceptos" → revisa → Aprovar.
3. Al copiar el brief de cualquier pieza, ya lleva su reparto de conceptos.
4. Si cambia la estructura, regenera el mapa.

## Fuera de alcance (posibles mejoras futuras)

- Reparto a nivel de objetivo (más fino, pero depende de los planes y se desactualiza
  al replanificar).
- Incluir el Módulo General (cuando se construya).
- Detección de repetición sobre el texto ya escrito (requeriría que el contenido
  vuelva a la app).
