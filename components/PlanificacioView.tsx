'use client'

import { useEffect, useState } from 'react'
import type { PlanModul, ObjetivoPlan } from '@/lib/systemPromptPlanificacion'
import { getConexionLibro, tieneCurriculoLibro } from '@/lib/curriculoLibros'
import FitxaPanel from './FitxaPanel'
import ConexionesPanel from './ConexionesPanel'

const DIAG_LABEL: Record<string, string> = {
  obstaculo: 'Obstacle',
  intuiciones_sueltas: 'Intuïcions soltes',
  laguna: 'Llacuna',
}
const DIAG_CLASS: Record<string, string> = {
  obstaculo: 'bg-amber-100 text-amber-800',
  intuiciones_sueltas: 'bg-sky-100 text-sky-800',
  laguna: 'bg-slate-100 text-slate-600',
}

function rowToPlan(row: Record<string, unknown>): PlanModul {
  return {
    modulo: row.modulo as string,
    idioma: (row.idioma as string) ?? 'ca',
    arco: row.arco as PlanModul['arco'],
    tiempo: row.tiempo as PlanModul['tiempo'],
    objetivos: (row.objetivos as ObjetivoPlan[]) ?? [],
    recomendacionesEstructura: (row.recomendaciones_estructura as string[]) ?? [],
  }
}

export default function PlanificacioView() {
  const [moduls, setModuls] = useState<string[]>([])
  const [modul, setModul] = useState('')
  const [horas, setHoras] = useState(24)
  const [reserva, setReserva] = useState(40)

  const [plan, setPlan] = useState<PlanModul | null>(null)
  const [estado, setEstado] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [obertes, setObertes] = useState<Set<number>>(new Set())
  const [planEstats, setPlanEstats] = useState<Record<string, string>>({})
  const [fichaByOrden, setFichaByOrden] = useState<Record<number, string>>({})
  const [contByKey, setContByKey] = useState<Record<string, string[]>>({})
  const [reptesByKey, setReptesByKey] = useState<Record<string, boolean>>({})
  const [indexCurs, setIndexCurs] = useState('')
  const [leccionsRaw, setLeccionsRaw] = useState<{ modulo: string; nom: string; ordre: number }[]>([])
  const [veureBrief, setVeureBrief] = useState<Set<number>>(new Set())
  const [copiat, setCopiat] = useState<string | null>(null)

  function copiar(text: string, etiqueta: string) {
    navigator.clipboard?.writeText(text)
    setCopiat(etiqueta)
    setTimeout(() => setCopiat(c => (c === etiqueta ? null : c)), 1500)
  }
  function toggleVeureBrief(orden: number) {
    setVeureBrief(prev => { const n = new Set(prev); if (n.has(orden)) n.delete(orden); else n.add(orden); return n })
  }

  async function loadStatus(nom: string) {
    if (!nom) { setFichaByOrden({}); setContByKey({}); setReptesByKey({}); return }
    const res = await fetch(`/api/planificacion/estat?modulo=${encodeURIComponent(nom)}`)
    if (!res.ok) return
    const d = await res.json()
    const fbo: Record<number, string> = {}
    for (const f of d.fichas ?? []) fbo[f.orden] = f.estado
    const cbk: Record<string, string[]> = {}
    for (const c of d.continguts ?? []) { const k = `${c.leccion}|${c.subtema}`; (cbk[k] = cbk[k] || []).push(c.idioma) }
    const rbk: Record<string, boolean> = {}
    for (const r of d.reptes ?? []) rbk[`${r.leccion}|${r.subtema}`] = true
    setFichaByOrden(fbo); setContByKey(cbk); setReptesByKey(rbk)
  }

  function toggleFitxa(orden: number) {
    setObertes(prev => {
      const next = new Set(prev)
      if (next.has(orden)) next.delete(orden); else next.add(orden)
      return next
    })
  }

  useEffect(() => {
    fetch('/api/indice')
      .then(r => r.json())
      .then(d => {
        setModuls((d.moduls ?? []).map((m: { nom: string }) => m.nom))
        setLeccionsRaw(d.leccions ?? [])
        setIndexCurs(buildIndexCurs(d.leccions ?? [], d.subtemes ?? []))
      })
      .catch(() => {})
    fetch('/api/planificacion/estat')
      .then(r => r.json())
      .then(d => {
        const m: Record<string, string> = {}
        for (const p of d.plans ?? []) m[p.modulo] = p.estado
        setPlanEstats(m)
      })
      .catch(() => {})
    // Recorda l'últim mòdul i carrega'l sol
    const last = typeof window !== 'undefined' ? localStorage.getItem('finomik_last_modul') : null
    if (last) { setModul(last); carregarExistent(last) }
  }, [])

  async function carregarExistent(nom: string) {
    setPlan(null); setEstado(null); setError('')
    if (!nom) return
    loadStatus(nom)
    const res = await fetch(`/api/planificacion/obtener?modulo=${encodeURIComponent(nom)}`)
    if (!res.ok) return
    const { data } = await res.json()
    if (data) { setPlan(rowToPlan(data)); setEstado(data.estado) }
  }

  async function generar() {
    if (!modul) return
    setLoading(true); setError(''); setPlan(null); setEstado(null)
    try {
      const res = await fetch('/api/planificacion/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modulo: modul, horasTotales: horas, reservaRetosPct: reserva, idioma: 'ca' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error generant el pla'); return }
      setPlan(data as PlanModul); setEstado('sense desar')
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function desar(nouEstat: 'propuesto' | 'aprobado') {
    if (!plan) return
    setSaving(true); setError('')
    const res = await fetch('/api/planificacion/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, estado: nouEstat }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error ?? 'Error desant')
    else { setEstado(nouEstat); setPlanEstats(prev => ({ ...prev, [modul]: nouEstat })) }
    setSaving(false)
  }

  const sumaMin = plan ? plan.objetivos.reduce((a, o) => a + (o.minutos || 0), 0) : 0
  const grups = plan ? groupObjetivos(plan.objetivos) : []
  // Ordena els blocs per l'ordre real de l'estructura (temari), no per ordre d'aparició al pla.
  const blockOrder = leccionsRaw.filter(l => l.modulo === modul).sort((a, b) => a.ordre - b.ordre).map(l => l.nom)
  if (blockOrder.length) {
    grups.sort((a, b) => {
      const ia = blockOrder.indexOf(a.bloque); const ib = blockOrder.indexOf(b.bloque)
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib)
    })
  }
  const labelByOrden: Record<number, string> = {}
  grups.forEach((g, gi) => g.subtemes.forEach((s, si) => s.objs.forEach((o, oi) => {
    labelByOrden[o.orden] = `${gi + 1}.${si + 1}${s.objs.length > 1 ? String.fromCharCode(97 + oi) : ''}`
  })))

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* Panell de control */}
      <aside className="w-full lg:w-1/4 border-r border-finomik-light2 p-6 flex flex-col gap-4 overflow-y-auto">
        <div>
          <label className="block text-xs font-extrabold text-finomik-mid3 mb-1">Mòdul</label>
          <select
            value={modul}
            onChange={e => {
              setModul(e.target.value)
              carregarExistent(e.target.value)
              if (typeof window !== 'undefined') localStorage.setItem('finomik_last_modul', e.target.value)
            }}
            className="w-full border border-finomik-light2 rounded-xl px-3 py-2 text-sm"
          >
            <option value="">Tria un mòdul…</option>
            {moduls.map(m => (
              <option key={m} value={m}>
                {planEstats[m] === 'aprobado' ? '✓ ' : planEstats[m] ? '~ ' : '· '}{m}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-finomik-mid3 mt-1">✓ pla aprovat · ~ esborrany · sense pla</p>
        </div>

        <button
          onClick={() => copiar(indexCurs, 'index')}
          disabled={!indexCurs}
          className="text-[11px] font-extrabold text-finomik-blue hover:underline text-left disabled:opacity-40"
        >
          {copiat === 'index' ? 'Índex copiat!' : 'Copiar índex del curs (per a les instruccions del GPT)'}
        </button>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-extrabold text-finomik-mid3 mb-1">Hores totals</label>
            <input type="number" value={horas} min={1}
              onChange={e => setHoras(Number(e.target.value))}
              className="w-full border border-finomik-light2 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-extrabold text-finomik-mid3 mb-1">Reserva reptes %</label>
            <input type="number" value={reserva} min={0} max={90}
              onChange={e => setReserva(Number(e.target.value))}
              className="w-full border border-finomik-light2 rounded-xl px-3 py-2 text-sm" />
          </div>
        </div>

        <button
          onClick={generar}
          disabled={!modul || loading}
          className="bg-finomik-blue text-white font-extrabold text-sm px-6 py-2.5 rounded-xl hover:bg-finomik-blue/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Dissenyant el pla…' : 'Generar pla'}
        </button>

        {estado && (
          <p className="text-xs font-extrabold text-finomik-mid3">
            Estat: <span className={estado === 'aprobado' ? 'text-green-700' : 'text-finomik-blue'}>{estado}</span>
          </p>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {plan && (
          <div className="flex flex-col gap-2 pt-2 border-t border-finomik-light2">
            <button onClick={() => desar('propuesto')} disabled={saving}
              className="border border-finomik-blue text-finomik-blue font-extrabold text-sm px-4 py-2 rounded-xl hover:bg-finomik-blue/5 transition disabled:opacity-40">
              {saving ? 'Desant…' : 'Desar esborrany'}
            </button>
            <button onClick={() => desar('aprobado')} disabled={saving}
              className="bg-finomik-gold text-finomik-blue font-extrabold text-sm px-4 py-2 rounded-xl hover:bg-finomik-gold/80 transition disabled:opacity-40">
              Aprovar pla
            </button>
          </div>
        )}
      </aside>

      {/* Vista del pla */}
      <section className="flex-1 p-6 overflow-y-auto bg-white">
        {!plan && !loading && (
          <div className="max-w-md">
            <h2 className="font-black text-finomik-blue text-lg mb-2">Disseny del curs</h2>
            <p className="text-finomik-mid3 text-sm mb-3">Tria un mòdul i dissenya'n l'aprenentatge per capes. Cada objectiu es construeix en ordre:</p>
            <ol className="text-sm text-finomik-mid3 list-decimal pl-5 flex flex-col gap-1">
              <li><span className="font-extrabold text-finomik-blue">Pla</span>: l'arc del mòdul i la seqüència d'objectius.</li>
              <li><span className="font-extrabold text-finomik-blue">Fitxa</span>: com s'ensenya cada objectiu.</li>
              <li><span className="font-extrabold text-finomik-blue">Contingut</span>: la peça redactada, en cada idioma.</li>
              <li><span className="font-extrabold text-finomik-blue">Reptes</span>: la pràctica per demostrar-ho.</li>
            </ol>
          </div>
        )}
        {loading && <p className="text-finomik-blue text-sm font-extrabold">Dissenyant el recorregut d'aprenentatge…</p>}

        {plan && (
          <div className="flex flex-col gap-6 max-w-4xl">
            {/* Arc */}
            <div className="bg-finomik-light2/30 border border-finomik-light2 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <h3 className="font-black text-finomik-blue">Arc del mòdul</h3>
                {estado && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    estado === 'aprobado' ? 'bg-green-100 text-green-800'
                    : estado === 'sense desar' ? 'bg-slate-100 text-slate-500'
                    : 'bg-amber-100 text-amber-800'
                  }`}>Pla: {estado}</span>
                )}
              </div>
              <dl className="grid grid-cols-1 gap-2 text-sm">
                <div><dt className="font-extrabold text-finomik-mid3 inline">Model inicial: </dt><dd className="inline">{plan.arco.modeloInicial}</dd></div>
                <div><dt className="font-extrabold text-finomik-mid3 inline">Recorregut: </dt><dd className="inline">{plan.arco.formaRecorrido}</dd></div>
                <div><dt className="font-extrabold text-finomik-mid3 inline">Model final: </dt><dd className="inline">{plan.arco.modeloFinal}</dd></div>
                <div><dt className="font-extrabold text-finomik-mid3 inline">Capacitat de decisió: </dt><dd className="inline">{plan.arco.capacidadDecision}</dd></div>
                <div><dt className="font-extrabold text-finomik-mid3 inline">Prova de l'arc: </dt><dd className="inline italic">{plan.arco.pruebaArco}</dd></div>
              </dl>
              <p className="text-xs text-finomik-mid3 mt-3">
                Temps contingut: {plan.tiempo.minutosContenido} min · Suma objectius: {sumaMin} min · {plan.objetivos.length} objectius
              </p>
            </div>

            {/* Adaptació al currículo oficial (només Economia) */}
            {tieneCurriculoLibro(modul) && <ConexionesPanel modulo={modul} />}

            {/* Objectius */}
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-black text-finomik-blue">Seqüència d'objectius</h3>
                <p className="text-xs text-finomik-mid3">Obre cada objectiu i genera, en ordre: 1 Fitxa didàctica → 2 Contingut (per idioma) → 3 Reptes.</p>
              </div>
              {grups.map((g, gi) => (
                <div key={g.bloque} className="rounded-2xl border border-finomik-light2 overflow-hidden">
                  <div className="bg-finomik-blue text-white px-4 py-2.5 flex items-center gap-2">
                    <span className="text-[11px] font-black opacity-70">BLOC {gi + 1}</span>
                    <span className="font-black text-sm">{g.bloque}</span>
                  </div>
                  <div className="p-3 flex flex-col gap-4">
                    {g.subtemes.map(s => (
                      <div key={s.subtema} className="border-l-4 border-finomik-gold pl-3">
                        <p className="text-xs font-black text-finomik-mid3 uppercase tracking-wide mb-2">{s.subtema}</p>
                        <div className="flex flex-col gap-3">
                          {s.objs.map(o => (
                            <div key={o.orden} className="border border-finomik-light2 rounded-xl p-4 bg-white">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-black text-finomik-blue">{labelByOrden[o.orden] ?? o.orden}</span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${DIAG_CLASS[o.diagnostico] ?? 'bg-slate-100'}`}>{DIAG_LABEL[o.diagnostico] ?? o.diagnostico}</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-finomik-light2/60 text-finomik-mid3">{o.papel}</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-finomik-light2/60 text-finomik-mid3">{o.profundidad}</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-finomik-light2/60 text-finomik-mid3">{o.estrategia}</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-finomik-light2/60 text-finomik-mid3">{o.minutos} min</span>
                                {o.espiral && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">espiral</span>}
                              </div>
                              <p className="text-sm font-extrabold text-finomik-blue">{o.objetivo}</p>
                              <div className="flex items-center gap-1 flex-wrap mt-1">
                                <EstatBadge text="Fitxa" estat={fichaByOrden[o.orden] === 'aprobado' ? 'ok' : fichaByOrden[o.orden] ? 'partial' : 'none'} />
                                {(() => {
                                  const idis = contByKey[`${o.bloque}|${o.subtema}`] || []
                                  return <EstatBadge text={idis.length ? `Contingut ${idis.join('/')}` : 'Contingut'} estat={idis.length ? 'ok' : 'none'} />
                                })()}
                                <EstatBadge text="Reptes" estat={reptesByKey[`${o.bloque}|${o.subtema}`] ? 'ok' : 'none'} />
                              </div>
                              <p className="text-sm mt-1">{o.obstaculoOLaguna}{o.porQuePlausible ? ` · plausible: ${o.porQuePlausible}` : ''}</p>
                              <p className="text-xs text-finomik-mid3 mt-1">
                                {o.dependencias?.length ? `Depèn de: ${o.dependencias.map(d => labelByOrden[d] ?? d).join(', ')} · ` : ''}{o.justificacion}
                              </p>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <button
                                  onClick={() => copiar(buildBrief(o, plan.arco, labelByOrden, plan.modulo), `brief-${o.orden}`)}
                                  className="bg-finomik-blue text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl hover:bg-finomik-blue/90 transition"
                                >
                                  {copiat === `brief-${o.orden}` ? 'Copiat!' : 'Copiar brief per a ChatGPT'}
                                </button>
                                <button
                                  onClick={() => toggleVeureBrief(o.orden)}
                                  className="text-[11px] font-extrabold text-finomik-blue hover:underline"
                                >
                                  {veureBrief.has(o.orden) ? 'Amagar brief' : 'Veure brief'}
                                </button>
                                <button
                                  onClick={() => toggleFitxa(o.orden)}
                                  className="text-[11px] font-extrabold text-finomik-mid3/60 hover:underline"
                                >
                                  Generar dins l'app (opcional)
                                </button>
                              </div>
                              {veureBrief.has(o.orden) && (
                                <pre className="mt-2 bg-finomik-light2/30 border border-finomik-light2 rounded-xl p-3 text-[11px] whitespace-pre-wrap font-sans">{buildBrief(o, plan.arco, labelByOrden, plan.modulo)}</pre>
                              )}
                              {obertes.has(o.orden) && <FitxaPanel modulo={plan.modulo} orden={o.orden} bloque={o.bloque} subtema={o.subtema} onSaved={() => loadStatus(modul)} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Recomanacions d'estructura */}
            {plan.recomendacionesEstructura.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h3 className="font-black text-amber-800 mb-2">Recomanacions a Disseny Curricular</h3>
                <ul className="list-disc pl-5 text-sm flex flex-col gap-1">
                  {plan.recomendacionesEstructura.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function buildIndexCurs(leccions: { modulo: string; nom: string }[], subtemes: { modulo: string; leccion: string; nom: string }[]): string {
  const byM = new Map<string, string[]>()
  for (const l of leccions) { if (!byM.has(l.modulo)) byM.set(l.modulo, []); byM.get(l.modulo)!.push(l.nom) }
  let out = 'ÍNDICE DEL CURSO (no repitas lo que ya se explica en otra pieza o módulo)\n'
  for (const [m, blocs] of byM) {
    out += `\n### ${m}\n`
    for (const b of blocs) {
      const s = subtemes.filter(x => x.modulo === m && x.leccion === b).map(x => x.nom)
      out += `  [${b}]\n    ${s.join(' · ')}\n`
    }
  }
  return out
}

function briefDiag(d: string): string {
  return d === 'obstaculo' ? 'obstáculo' : d === 'intuiciones_sueltas' ? 'intuiciones sueltas' : 'laguna'
}

function buildBrief(o: ObjetivoPlan, arco: PlanModul['arco'], labelByOrden: Record<number, string>, modulo: string): string {
  const dep = o.dependencias?.length ? o.dependencias.map(d => labelByOrden[d] ?? d).join(', ') : 'nada'
  const conexioLibro = getConexionLibro(modulo, o.bloque)
  const seccioLibro = conexioLibro
    ? `\n\nCONEXIÓN CON EL LIBRO REAL (esta asignatura tiene un libro de texto oficial; conecta la pieza con esta parte del temario, usa su terminología y respeta cómo el libro ordena los contenidos, pero NO lo repitas literal ni lo sustituyas: aterrízalo en una decisión real del alumno)
- ${conexioLibro}`
    : ''
  return `ARCO DEL MÓDULO
- Modelo inicial: ${arco.modeloInicial}
- Recorrido: ${arco.formaRecorrido}
- Modelo final: ${arco.modeloFinal}
- Capacidad: ${arco.capacidadDecision}
- Prueba del arco: ${arco.pruebaArco}

OBJETIVO DE ESTA PIEZA (${labelByOrden[o.orden] ?? o.orden})
- Bloque: ${o.bloque}
- Subtema: ${o.subtema}
- Cambio: ${o.objetivo}
- Diagnóstico: ${briefDiag(o.diagnostico)} (${o.obstaculoOLaguna})
- Papel: ${o.papel} · Profundidad: ${o.profundidad}
- Minutos: ${o.minutos} · Espiral: ${o.espiral ? 'sí' : 'no'} · Depende de: ${dep}${seccioLibro}

Diseña la pieza y escríbela en los tres idiomas (catalán, castellano, inglés).`
}

interface Grup { bloque: string; subtemes: { subtema: string; objs: ObjetivoPlan[] }[] }

function groupObjetivos(objetivos: ObjetivoPlan[]): Grup[] {
  const grups: Grup[] = []
  for (const o of objetivos) {
    let g = grups.find(x => x.bloque === o.bloque)
    if (!g) { g = { bloque: o.bloque, subtemes: [] }; grups.push(g) }
    let s = g.subtemes.find(x => x.subtema === o.subtema)
    if (!s) { s = { subtema: o.subtema, objs: [] }; g.subtemes.push(s) }
    s.objs.push(o)
  }
  return grups
}

function EstatBadge({ text, estat }: { text: string; estat: 'ok' | 'partial' | 'none' }) {
  const cls = estat === 'ok' ? 'bg-green-100 text-green-800'
    : estat === 'partial' ? 'bg-amber-100 text-amber-800'
    : 'bg-slate-100 text-slate-400'
  const icon = estat === 'ok' ? '✓' : estat === 'partial' ? '~' : '·'
  return <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cls}`}>{icon} {text}</span>
}
