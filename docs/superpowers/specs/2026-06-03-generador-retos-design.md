# Generador de Retos Educativos — Spec de Diseño

**Fecha:** 2026-06-03
**Proyecto:** Finomik — Herramienta interna

---

## Resumen

App web interna desplegada en Vercel. Permite pegar contenido educativo de una lección, seleccionar tipos de reto, y recibir retos/minijuegos generados por Claude directamente en la interfaz.

---

## Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Estilos:** Tailwind CSS
- **IA:** API de Anthropic (claude-sonnet-4-6)
- **Auth:** Contraseña simple via variable de entorno, sesión en cookie httpOnly
- **Deploy:** Vercel

---

## Brand Guidelines

- **Color principal:** #0B3064 (Azul Finomik)
- **Accent:** #F5C518 (Dorado Finomik)
- **Blanco:** #FFFFFF
- **Secundarios:** #114076, #3C4C67, #3E5374, #5574A7, #8F9EB7, #C8D0DD
- **Tipografía:** Montserrat (Black para títulos, ExtraBold para subtítulos, Regular para cuerpo)

---

## Autenticación

- Una sola ruta protegida: `/`
- Si no hay sesión válida, redirige a `/login`
- Login: campo de contraseña, sin campo de usuario
- La contraseña se compara con la variable de entorno `APP_PASSWORD`
- Si es correcta, se guarda una cookie httpOnly `session=authenticated` con 30 días de expiración
- Botón de logout en la interfaz principal

---

## Variables de entorno necesarias

```
ANTHROPIC_API_KEY=...
APP_PASSWORD=...
```

---

## Estructura de rutas

```
/login        → Pantalla de login
/             → Herramienta principal (protegida)
/api/generate → Endpoint que llama a Claude API (protegido)
/api/login    → Endpoint que valida contraseña y setea cookie
/api/logout   → Endpoint que borra cookie
```

---

## Interfaz principal

### Layout

Dos columnas en desktop, apiladas en móvil:

- **Columna izquierda (40%):** Entrada de contenido y configuración
- **Columna derecha (60%):** Output generado

Header con logo Finomik y botón de logout.

### Columna izquierda

1. **Área de texto** — Placeholder: "Pega aquí el contenido de la lección..."
   - Altura mínima: 300px, expandible
2. **Selector de tipos de reto** — 14 opciones:
   - Checkbox "Selección recomendada por IA" (marca todos como "dejar elegir a Claude")
   - 13 checkboxes individuales, uno por tipo de reto
   - Si se activa "Selección recomendada", se deshabilitan los individuales
3. **Botón "Generar retos"** — Color dorado (#F5C518), texto azul oscuro (#0B3064)
   - Deshabilitado si el área de texto está vacía
   - Durante la generación muestra spinner y texto "Generando..."

### Columna derecha

- Estado vacío: mensaje de bienvenida con instrucciones breves
- Durante generación: skeleton loader
- Con resultado:
  - Tabla resumen al inicio
  - Retos desarrollados debajo, cada uno en una card separada
  - Botón "Copiar todo" en la parte superior del output

---

## API Route: /api/generate

- Método: POST
- Verifica cookie de sesión antes de procesar
- Body: `{ content: string, selectedTypes: number[] | "recommended" }`
- Construye el prompt con las instrucciones del generador + contenido pegado + tipos seleccionados
- Llama a Claude API con streaming
- Devuelve la respuesta como stream para que el output aparezca progresivamente en pantalla

### Prompt enviado a Claude

Usa el contenido de `instrucciones-generador-retos.md` como system prompt.
El user message incluye:
- El contenido pegado por el usuario
- Los tipos de reto seleccionados (o instrucción de recomendar)

---

## Estados de la interfaz

| Estado | Comportamiento |
|--------|---------------|
| Vacío | Placeholder en textarea, botón deshabilitado |
| Escribiendo | Botón se habilita |
| Generando | Spinner, botón deshabilitado, skeleton en output |
| Con resultado | Output completo, botón "Copiar todo" visible |
| Error | Mensaje de error en rojo bajo el botón |

---

## Estructura de archivos

```
herramienta-retos/
  app/
    layout.tsx
    page.tsx                  → Herramienta principal
    login/
      page.tsx
    api/
      generate/
        route.ts
      login/
        route.ts
      logout/
        route.ts
  components/
    Header.tsx
    ContentInput.tsx
    TypeSelector.tsx
    GenerateButton.tsx
    OutputPanel.tsx
  middleware.ts               → Protección de rutas
  instrucciones-generador-retos.md
  .env.local                  → API key y contraseña (no commitear)
```
