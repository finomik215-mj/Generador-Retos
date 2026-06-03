# Generador de Retos Educativos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an internal Next.js web app deployed on Vercel where a user pastes lesson content, selects challenge types, and receives AI-generated educational minigame designs via Claude API streaming.

**Architecture:** Next.js App Router with a middleware-based auth guard (httpOnly cookie). The UI splits into a left input panel and right streaming output panel. A single `/api/generate` route reads the system prompt from the filesystem and streams Claude's response to the client.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Anthropic SDK (`@anthropic-ai/sdk`), Vercel

---

## File Map

| File | Role |
|------|------|
| `app/layout.tsx` | Root layout — loads Montserrat font from Google Fonts |
| `app/page.tsx` | Main tool page (protected) — renders Header + two-column layout |
| `app/login/page.tsx` | Login page — password form |
| `app/api/generate/route.ts` | POST — reads system prompt, calls Claude with streaming |
| `app/api/login/route.ts` | POST — validates password, sets session cookie |
| `app/api/logout/route.ts` | POST — clears session cookie |
| `middleware.ts` | Guards all routes except `/login` and `/api/login` |
| `components/Header.tsx` | Top bar with Finomik logo text and logout button |
| `components/ContentInput.tsx` | Textarea for pasting lesson content |
| `components/TypeSelector.tsx` | 13 checkboxes + "Recommended" option |
| `components/GenerateButton.tsx` | Submit button with loading state |
| `components/OutputPanel.tsx` | Streaming output display with copy button |
| `lib/systemPrompt.ts` | Reads `instrucciones-generador-retos.md` from filesystem |
| `lib/buildUserMessage.ts` | Builds the user message from content + selected types |
| `tailwind.config.ts` | Extends theme with Finomik brand colors and Montserrat font |
| `.env.local` | `ANTHROPIC_API_KEY` and `APP_PASSWORD` (never commit) |
| `.gitignore` | Includes `.env.local` |

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next.config.ts`
- Create: `.gitignore`
- Create: `.env.local`

- [ ] **Step 1: Initialise the project**

Run inside `herramienta-retos/`:
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --no-import-alias --eslint
```
Accept all defaults when prompted.

- [ ] **Step 2: Install Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

- [ ] **Step 3: Add `.env.local`**

Create `herramienta-retos/.env.local`:
```
ANTHROPIC_API_KEY=your_key_here
APP_PASSWORD=your_password_here
```

- [ ] **Step 4: Ensure `.env.local` is in `.gitignore`**

Open `.gitignore` and confirm `.env.local` is listed. If not, add it.

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```
Expected: server running at `http://localhost:3000` with default Next.js page.

- [ ] **Step 6: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js project with Tailwind and Anthropic SDK"
```

---

## Task 2: Brand theme — Tailwind + Montserrat

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Extend Tailwind with Finomik brand colors and font**

Replace the contents of `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        finomik: {
          blue:    '#0B3064',
          blueDark:'#114076',
          gold:    '#F5C518',
          mid1:    '#3C4C67',
          mid2:    '#3E5374',
          mid3:    '#5574A7',
          light1:  '#8F9EB7',
          light2:  '#C8D0DD',
        },
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 2: Load Montserrat from Google Fonts in root layout**

Replace `app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '700', '800', '900'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'Generador de Retos — Finomik',
  description: 'Herramienta interna para generar retos educativos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} font-montserrat bg-white text-finomik-blue`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts app/layout.tsx
git commit -m "feat: add Finomik brand theme — colors and Montserrat font"
```

---

## Task 3: Auth — middleware + API routes

**Files:**
- Create: `middleware.ts`
- Create: `app/api/login/route.ts`
- Create: `app/api/logout/route.ts`

- [ ] **Step 1: Create middleware to guard protected routes**

Create `middleware.ts` at the project root:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isLoginApi = request.nextUrl.pathname === '/api/login'

  if (isLoginPage || isLoginApi) return NextResponse.next()

  if (session !== 'authenticated') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: Create login API route**

Create `app/api/login/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  return response
}
```

- [ ] **Step 3: Create logout API route**

Create `app/api/logout/route.ts`:
```typescript
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000')
  )
  response.cookies.set('session', '', { maxAge: 0, path: '/' })
  return response
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts app/api/login/route.ts app/api/logout/route.ts
git commit -m "feat: add cookie-based auth middleware and login/logout API routes"
```

---

## Task 4: Login page

**Files:**
- Create: `app/login/page.tsx`

- [ ] **Step 1: Create login page**

Create `app/login/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    setLoading(false)

    if (res.ok) {
      router.push('/')
    } else {
      setError('Contraseña incorrecta')
    }
  }

  return (
    <main className="min-h-screen bg-finomik-blue flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-sm">
        <h1 className="font-black text-3xl text-finomik-blue text-center mb-2">
          Finomik
        </h1>
        <p className="text-center text-finomik-mid1 text-sm mb-8 font-medium">
          Generador de Retos Educativos
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="border border-finomik-light2 rounded-lg px-4 py-3 text-finomik-blue placeholder-finomik-light1 focus:outline-none focus:ring-2 focus:ring-finomik-blue"
            required
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="bg-finomik-gold text-finomik-blue font-extrabold py-3 rounded-lg hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Test login flow manually**

```bash
npm run dev
```
Navigate to `http://localhost:3000` — should redirect to `/login`.
Enter wrong password — should show error.
Enter correct password (from `.env.local`) — should redirect to `/`.

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: add login page with Finomik brand styles"
```

---

## Task 5: System prompt reader and user message builder

**Files:**
- Create: `lib/systemPrompt.ts`
- Create: `lib/buildUserMessage.ts`

- [ ] **Step 1: Create system prompt reader**

Create `lib/systemPrompt.ts`:
```typescript
import fs from 'fs'
import path from 'path'

export function getSystemPrompt(): string {
  const filePath = path.join(process.cwd(), 'instrucciones-generador-retos.md')
  return fs.readFileSync(filePath, 'utf-8')
}
```

- [ ] **Step 2: Create user message builder**

Create `lib/buildUserMessage.ts`:
```typescript
const RETO_NAMES: Record<number, string> = {
  1:  'Quiz rápido multi-opción',
  2:  'Distribución',
  3:  'Ordenación',
  4:  'Consecuencia inmediata',
  5:  'Evento inesperado',
  6:  'Consecuencia diferida',
  7:  'Verdadero / Falso',
  8:  'Rellenar huecos',
  9:  'Matching / Emparejar',
  10: 'Cálculo guiado',
  11: 'Elección binaria con presión',
  12: 'Predicción',
  13: 'Mini-caso / Historia corta',
}

export function buildUserMessage(
  content: string,
  selectedTypes: number[] | 'recommended'
): string {
  const typeSection =
    selectedTypes === 'recommended'
      ? 'Haz una selección recomendada de tipos de reto según el contenido.'
      : `Genera únicamente los siguientes tipos de reto: ${selectedTypes
          .map(n => `${n}. ${RETO_NAMES[n]}`)
          .join(', ')}.`

  return `## Contenido de la lección\n\n${content}\n\n## Instrucción sobre tipos de reto\n\n${typeSection}`
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/systemPrompt.ts lib/buildUserMessage.ts
git commit -m "feat: add system prompt reader and user message builder"
```

---

## Task 6: Generate API route (streaming)

**Files:**
- Create: `app/api/generate/route.ts`

- [ ] **Step 1: Create streaming generate route**

Create `app/api/generate/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSystemPrompt } from '@/lib/systemPrompt'
import { buildUserMessage } from '@/lib/buildUserMessage'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (session !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { content, selectedTypes } = await req.json() as {
    content: string
    selectedTypes: number[] | 'recommended'
  }

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Contenido vacío' }, { status: 400 })
  }

  const systemPrompt = getSystemPrompt()
  const userMessage = buildUserMessage(content, selectedTypes)

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/generate/route.ts
git commit -m "feat: add streaming generate API route with Claude"
```

---

## Task 7: UI components

**Files:**
- Create: `components/Header.tsx`
- Create: `components/ContentInput.tsx`
- Create: `components/TypeSelector.tsx`
- Create: `components/GenerateButton.tsx`
- Create: `components/OutputPanel.tsx`

- [ ] **Step 1: Create Header**

Create `components/Header.tsx`:
```tsx
export default function Header() {
  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <header className="bg-finomik-blue px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-finomik-gold font-black text-2xl tracking-tight">
          Finomik
        </span>
        <span className="text-finomik-light2 text-sm font-medium hidden sm:block">
          Generador de Retos
        </span>
      </div>
      <button
        onClick={handleLogout}
        className="text-finomik-light2 hover:text-white text-sm font-medium transition"
      >
        Cerrar sesión
      </button>
    </header>
  )
}
```

- [ ] **Step 2: Create ContentInput**

Create `components/ContentInput.tsx`:
```tsx
interface ContentInputProps {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}

export default function ContentInput({ value, onChange, disabled }: ContentInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-extrabold text-finomik-blue text-sm uppercase tracking-wide">
        Contenido de la lección
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Pega aquí el contenido de la lección..."
        className="border border-finomik-light2 rounded-xl px-4 py-3 text-sm text-finomik-blue placeholder-finomik-light1 focus:outline-none focus:ring-2 focus:ring-finomik-blue resize-y min-h-[300px] disabled:opacity-60"
      />
    </div>
  )
}
```

- [ ] **Step 3: Create TypeSelector**

Create `components/TypeSelector.tsx`:
```tsx
const RETO_TYPES = [
  { id: 1,  label: 'Quiz rápido multi-opción' },
  { id: 2,  label: 'Distribución' },
  { id: 3,  label: 'Ordenación' },
  { id: 4,  label: 'Consecuencia inmediata' },
  { id: 5,  label: 'Evento inesperado' },
  { id: 6,  label: 'Consecuencia diferida' },
  { id: 7,  label: 'Verdadero / Falso' },
  { id: 8,  label: 'Rellenar huecos' },
  { id: 9,  label: 'Matching / Emparejar' },
  { id: 10, label: 'Cálculo guiado' },
  { id: 11, label: 'Elección binaria con presión' },
  { id: 12, label: 'Predicción' },
  { id: 13, label: 'Mini-caso / Historia corta' },
]

interface TypeSelectorProps {
  recommended: boolean
  selected: number[]
  onRecommendedChange: (v: boolean) => void
  onSelectedChange: (v: number[]) => void
  disabled: boolean
}

export default function TypeSelector({
  recommended,
  selected,
  onRecommendedChange,
  onSelectedChange,
  disabled,
}: TypeSelectorProps) {
  function toggleType(id: number) {
    if (selected.includes(id)) {
      onSelectedChange(selected.filter(x => x !== id))
    } else {
      onSelectedChange([...selected, id])
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="font-extrabold text-finomik-blue text-sm uppercase tracking-wide">
        Tipos de reto
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={recommended}
          onChange={e => onRecommendedChange(e.target.checked)}
          disabled={disabled}
          className="accent-finomik-gold w-4 h-4"
        />
        <span className="font-extrabold text-finomik-blue text-sm">
          Selección recomendada por IA
        </span>
      </label>

      <div className="grid grid-cols-1 gap-2 pl-1">
        {RETO_TYPES.map(rt => (
          <label
            key={rt.id}
            className={`flex items-center gap-3 cursor-pointer ${recommended || disabled ? 'opacity-40 pointer-events-none' : ''}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(rt.id)}
              onChange={() => toggleType(rt.id)}
              disabled={recommended || disabled}
              className="accent-finomik-blue w-4 h-4"
            />
            <span className="text-sm text-finomik-mid1">
              {rt.id}. {rt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create GenerateButton**

Create `components/GenerateButton.tsx`:
```tsx
interface GenerateButtonProps {
  onClick: () => void
  disabled: boolean
  loading: boolean
}

export default function GenerateButton({ onClick, disabled, loading }: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-finomik-gold text-finomik-blue font-extrabold py-3 rounded-xl hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {loading ? 'Generando...' : 'Generar retos'}
    </button>
  )
}
```

- [ ] **Step 5: Create OutputPanel**

Create `components/OutputPanel.tsx`:
```tsx
'use client'

import { useState } from 'react'

interface OutputPanelProps {
  output: string
  loading: boolean
}

export default function OutputPanel({ output, loading }: OutputPanelProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading && !output) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 bg-finomik-light2 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
        ))}
      </div>
    )
  }

  if (!output) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 gap-4">
        <div className="text-5xl">🎯</div>
        <p className="font-extrabold text-finomik-blue text-lg">Los retos aparecerán aquí</p>
        <p className="text-finomik-mid3 text-sm max-w-xs">
          Pega el contenido de tu lección, elige los tipos de reto y pulsa "Generar retos".
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={handleCopy}
          className="text-sm font-medium text-finomik-blue border border-finomik-light2 px-4 py-2 rounded-lg hover:bg-finomik-light2 transition"
        >
          {copied ? 'Copiado' : 'Copiar todo'}
        </button>
      </div>
      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-finomik-blue font-montserrat text-sm leading-relaxed">
        {output}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/
git commit -m "feat: add all UI components with Finomik brand styles"
```

---

## Task 8: Main page — wire everything together

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Build main page**

Replace `app/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import ContentInput from '@/components/ContentInput'
import TypeSelector from '@/components/TypeSelector'
import GenerateButton from '@/components/GenerateButton'
import OutputPanel from '@/components/OutputPanel'

export default function HomePage() {
  const [content, setContent] = useState('')
  const [recommended, setRecommended] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<number[]>([])
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canGenerate = content.trim().length > 0 && (recommended || selectedTypes.length > 0)

  async function handleGenerate() {
    setLoading(true)
    setOutput('')
    setError('')

    const body = {
      content,
      selectedTypes: recommended ? 'recommended' : selectedTypes,
    }

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error desconocido')
      setLoading(false)
      return
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setOutput(prev => prev + decoder.decode(value))
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Left panel */}
        <aside className="w-full lg:w-2/5 border-r border-finomik-light2 p-6 flex flex-col gap-6 overflow-y-auto">
          <ContentInput value={content} onChange={setContent} disabled={loading} />
          <TypeSelector
            recommended={recommended}
            selected={selectedTypes}
            onRecommendedChange={setRecommended}
            onSelectedChange={setSelectedTypes}
            disabled={loading}
          />
          <GenerateButton onClick={handleGenerate} disabled={!canGenerate || loading} loading={loading} />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </aside>

        {/* Right panel */}
        <section className="flex-1 p-6 overflow-y-auto bg-white">
          <OutputPanel output={output} loading={loading} />
        </section>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Test full flow manually**

```bash
npm run dev
```
1. Open `http://localhost:3000` — redirects to `/login`.
2. Login with correct password — redirects to `/`.
3. Paste any text into the content area.
4. Leave "Selección recomendada por IA" checked.
5. Click "Generar retos" — spinner appears, text streams in on the right.
6. Click "Copiar todo" — content copies to clipboard.
7. Click "Cerrar sesión" — redirects to `/login`.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire up main page with streaming generation"
```

---

## Task 9: Deploy to Vercel

**Files:** None (Vercel configuration via dashboard)

- [ ] **Step 1: Push to GitHub**

Create a new GitHub repository named `finomik-generador-retos` and push:
```bash
git remote add origin https://github.com/<your-org>/finomik-generador-retos.git
git push -u origin main
```

- [ ] **Step 2: Import project in Vercel**

1. Go to vercel.com, click "Add New Project".
2. Import the `finomik-generador-retos` repository.
3. Set Root Directory to `herramienta-retos/` if the repo contains other folders, otherwise leave blank.
4. Add environment variables:
   - `ANTHROPIC_API_KEY` — your Anthropic key
   - `APP_PASSWORD` — your chosen password
   - `NEXT_PUBLIC_BASE_URL` — the Vercel URL once assigned (e.g. `https://finomik-generador-retos.vercel.app`)
5. Click "Deploy".

- [ ] **Step 3: Verify production deploy**

1. Open the assigned Vercel URL.
2. Should redirect to `/login`.
3. Login with the password set in env vars.
4. Generate retos with test content.
5. Confirm streaming works in production.
