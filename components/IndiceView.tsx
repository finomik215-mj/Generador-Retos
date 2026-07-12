'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { RetoGuardado } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────
type Pes = 'lleuger' | 'normal' | 'intens'

interface Modul    { id: string; nom: string; ordre: number }
interface Leccio   { id: string; modulo: string; nom: string; ordre: number }
interface Subtema  { id: string; modulo: string; leccion: string; nom: string; ordre: number }

interface ContenidoStatus { modulo: string; leccion: string; subtema: string; id: string }
interface RetosStatus     { modulo: string; leccion: string; subtema: string }

interface Props {
  onSelectSubtema: (item: { modulo: string; leccion: string; subtema: string; pes: Pes }) => void
}

function derivarPes(blocNom: string, totalBlocs: number, blocIndex: number): Pes {
  const nom = blocNom.toLowerCase()
  if (blocIndex === 0) return 'lleuger'
  if (blocIndex >= totalBlocs - 1) return 'normal'
  if (/eina|product|invers|nòmina|impost|contrac|mercat|simulad/.test(nom)) return 'intens'
  if (/hàbit|consolidar|reflexi|construir|aprendr/.test(nom)) return 'lleuger'
  return 'normal'
}

// ── Drag handle icon ───────────────────────────────────────────────────────
function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-current">
      <circle cx="4" cy="3" r="1.2" fill="currentColor"/>
      <circle cx="4" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="4" cy="11" r="1.2" fill="currentColor"/>
      <circle cx="10" cy="3" r="1.2" fill="currentColor"/>
      <circle cx="10" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="10" cy="11" r="1.2" fill="currentColor"/>
    </svg>
  )
}

// ── Subtema expanded detail ────────────────────────────────────────────────
function SubtemaDetail({ modulo, leccion, subtema, onSelect, onRefresh }: {
  modulo: string; leccion: string; subtema: string
  onSelect: () => void; onRefresh: () => void
}) {
  const [contenido, setContenido] = useState<{ id: string; contenido: string } | null>(null)
  const [retos, setRetos] = useState<RetoGuardado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({ modulo, leccion, subtema })
    Promise.all([
      fetch(`/api/contenido/obtener?${params}`).then(r => r.ok ? r.json() : { data: null }),
      fetch(`/api/retos/listar?${params}`).then(r => r.ok ? r.json() : { data: [] }),
    ]).then(([cData, rData]) => {
      setContenido(cData.data ? { id: cData.data.id, contenido: cData.data.contenido } : null)
      setRetos(rData.data ?? [])
      setLoading(false)
    })
  }, [modulo, leccion, subtema])

  async function deleteContenido(id: string) {
    if (!confirm('Eliminar aquest contingut?')) return
    await fetch('/api/contenido/eliminar', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setContenido(null); onRefresh()
  }
  async function deleteReto(id: string) {
    if (!confirm('Eliminar aquest repte?')) return
    await fetch('/api/retos/eliminar', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setRetos(prev => prev.filter(r => r.id !== id)); onRefresh()
  }

  if (loading) return <p className="text-xs text-finomik-mid3 animate-pulse px-10 py-2">Carregant...</p>

  return (
    <div className="px-10 pb-4 flex flex-col gap-3">
      {contenido ? (
        <div className="border border-green-200 rounded-xl px-4 py-3 bg-green-50 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-green-700 uppercase tracking-wide">Contingut aprovat</span>
            <button onClick={() => deleteContenido(contenido.id)} className="text-xs text-red-400 hover:text-red-600 font-bold transition">Eliminar contingut</button>
          </div>
          <p className="text-xs text-finomik-mid2 leading-relaxed">
            {contenido.contenido.length > 180 ? contenido.contenido.slice(0, 180) + '...' : contenido.contenido}
          </p>
          <button onClick={onSelect} className="self-start text-xs font-extrabold text-green-700 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-100 transition">Veure contingut complet</button>
        </div>
      ) : (
        <button onClick={onSelect} className="self-start text-xs font-extrabold bg-finomik-blue text-white px-4 py-2 rounded-xl hover:bg-finomik-mid1 transition">
          Generar contingut per a aquest subtema
        </button>
      )}
      {retos.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-extrabold text-finomik-mid3 uppercase tracking-wide">Reptes desats</span>
          {retos.map(reto => {
            const firstValue = Object.values(reto.datos ?? {})[0] as string | undefined
            return (
              <div key={reto.id} className="border border-finomik-light2 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {reto.aprobado && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
                  <span className="bg-finomik-blue/10 text-finomik-blue text-xs font-extrabold px-2 py-0.5 rounded-full shrink-0">{reto.tipo_reto}</span>
                  {firstValue && <span className="text-xs text-finomik-mid2 truncate">{String(firstValue).slice(0, 60)}{String(firstValue).length > 60 ? '...' : ''}</span>}
                </div>
                <button onClick={() => deleteReto(reto.id)} className="text-xs text-red-400 hover:text-red-600 font-bold transition shrink-0">Eliminar</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Sortable Subtema ───────────────────────────────────────────────────────
function SortableSubtema({ subtema, pes, contenidoStatus, retosStatus, onSelectSubtema, onDeleteSubtema, onRefresh }: {
  subtema: Subtema
  pes: Pes
  contenidoStatus: ContenidoStatus[]
  retosStatus: RetosStatus[]
  onSelectSubtema: Props['onSelectSubtema']
  onDeleteSubtema: () => void
  onRefresh: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subtema.id })
  const [expanded, setExpanded] = useState(false)
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  const tieneContenido = contenidoStatus.some(c => c.modulo === subtema.modulo && c.leccion === subtema.leccion && c.subtema === subtema.nom)
  const tieneRetos = retosStatus.some(r => r.modulo === subtema.modulo && r.leccion === subtema.leccion && r.subtema === subtema.nom)

  const pesLabel = pes === 'intens' ? '🔴' : pes === 'normal' ? '🟡' : '🟢'

  return (
    <div ref={setNodeRef} style={style} className="border-t border-finomik-light2/60 group/sub">
      <div className="flex items-center justify-between px-5 py-3 hover:bg-finomik-light2/20 transition">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-finomik-mid3/40 hover:text-finomik-mid3 transition shrink-0 touch-none">
            <GripIcon />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 flex-1 text-left min-w-0">
            <span className="text-finomik-mid3 text-xs w-3 shrink-0">{expanded ? '▼' : '▶'}</span>
            <span title={pes} className="shrink-0 text-xs">{pesLabel}</span>
            <span className="text-sm font-medium text-finomik-blue truncate">{subtema.nom}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {tieneRetos && <span className="bg-finomik-gold/20 text-finomik-blue text-xs font-bold px-2 py-0.5 rounded-full">Reptes ✓</span>}
              {tieneContenido && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Contingut ✓</span>}
              {!tieneContenido && !tieneRetos && <span className="bg-finomik-light2 text-finomik-mid3 text-xs font-bold px-2 py-0.5 rounded-full">Pendent</span>}
            </div>
          </button>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectSubtema({ modulo: subtema.modulo, leccion: subtema.leccion, subtema: subtema.nom, pes })}
            className="text-finomik-blue text-xs font-extrabold hover:text-finomik-mid1 transition px-2 py-1 rounded-lg hover:bg-finomik-blue/10"
          >
            {tieneContenido ? '→ Veure' : '→ Generar'}
          </button>
          <button onClick={onDeleteSubtema} className="text-red-300 hover:text-red-500 text-xs font-bold transition opacity-0 group-hover/sub:opacity-100">Eliminar</button>
        </div>
      </div>

      {expanded && (
        <SubtemaDetail
          modulo={subtema.modulo}
          leccion={subtema.leccion}
          subtema={subtema.nom}
          onSelect={() => onSelectSubtema({ modulo: subtema.modulo, leccion: subtema.leccion, subtema: subtema.nom, pes })}
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}

// ── Sortable Leccio ────────────────────────────────────────────────────────
function SortableLeccio({ leccio, leccioIndex, totalLeccions, subtemes, contenidoStatus, retosStatus, onSelectSubtema, onDeleteLeccio, onRefresh, onAddSubtema, onDeleteSubtema, onReorderSubtemes }: {
  leccio: Leccio
  leccioIndex: number
  totalLeccions: number
  subtemes: Subtema[]
  contenidoStatus: ContenidoStatus[]
  retosStatus: RetosStatus[]
  onSelectSubtema: Props['onSelectSubtema']
  onDeleteLeccio: () => void
  onRefresh: () => void
  onAddSubtema: (leccio: Leccio) => void
  onDeleteSubtema: (s: Subtema) => void
  onReorderSubtemes: (leccioId: string, newOrder: Subtema[]) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: leccio.id })
  const [collapsed, setCollapsed] = useState(false)
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const pes = derivarPes(leccio.nom, totalLeccions, leccioIndex)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = subtemes.findIndex(s => s.id === active.id)
    const newIdx = subtemes.findIndex(s => s.id === over.id)
    const reordered = arrayMove(subtemes, oldIdx, newIdx).map((s, i) => ({ ...s, ordre: i }))
    onReorderSubtemes(leccio.id, reordered)
    reordered.forEach(s => fetch('/api/subtemes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, ordre: s.ordre }) }))
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="bg-finomik-light2/40 px-5 py-2.5 flex items-center justify-between group/lec">
        <div className="flex items-center gap-2 flex-1">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-finomik-mid3/40 hover:text-finomik-mid3 transition shrink-0 touch-none">
            <GripIcon />
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2 flex-1 text-left">
            <span className="text-finomik-mid3 text-xs w-3">{collapsed ? '▶' : '▼'}</span>
            <h4 className="font-extrabold text-finomik-mid2 text-xs uppercase tracking-wide">{leccio.nom}</h4>
            <span className="text-finomik-mid3 text-xs">({subtemes.length})</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          {!collapsed && (
            <button onClick={() => onAddSubtema(leccio)} className="text-finomik-blue text-xs font-extrabold hover:text-finomik-mid1 transition shrink-0">+ Subtema</button>
          )}
          <button onClick={onDeleteLeccio} className="text-red-400 hover:text-red-600 text-xs font-bold transition opacity-0 group-hover/lec:opacity-100 shrink-0">Eliminar</button>
        </div>
      </div>

      {!collapsed && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={subtemes.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col">
              {subtemes.length === 0 && (
                <p className="px-5 py-3 text-xs text-finomik-mid3 italic">Sense subtemes.</p>
              )}
              {subtemes.map(s => (
                <SortableSubtema
                  key={s.id}
                  subtema={s}
                  pes={pes}
                  contenidoStatus={contenidoStatus}
                  retosStatus={retosStatus}
                  onSelectSubtema={onSelectSubtema}
                  onDeleteSubtema={() => onDeleteSubtema(s)}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

// ── Add form modal overlay ─────────────────────────────────────────────────
function AddModal({ title, placeholder, onSave, onCancel, saving }: {
  title: string; placeholder: string; onSave: (v: string) => void; onCancel: () => void; saving: boolean
}) {
  const [val, setVal] = useState('')
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col gap-4">
        <h3 className="font-black text-finomik-blue text-base">{title}</h3>
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && val.trim() && !saving) onSave(val.trim()); if (e.key === 'Escape') onCancel() }}
          placeholder={placeholder}
          className="border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue placeholder:text-finomik-mid3 focus:outline-none focus:ring-2 focus:ring-finomik-blue/20"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="border border-finomik-light2 text-finomik-mid3 rounded-xl px-4 py-2 text-sm hover:bg-finomik-light2 transition">Cancel·lar</button>
          <button onClick={() => val.trim() && onSave(val.trim())} disabled={!val.trim() || saving} className="bg-finomik-blue text-white rounded-xl px-5 py-2 font-extrabold text-sm hover:bg-finomik-mid1 transition disabled:opacity-40">
            {saving ? 'Desant...' : 'Desar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main IndiceView ────────────────────────────────────────────────────────
export default function IndiceView({ onSelectSubtema }: Props) {
  const [moduls, setModuls]       = useState<Modul[]>([])
  const [leccions, setLeccions]   = useState<Leccio[]>([])
  const [subtemes, setSubtemes]   = useState<Subtema[]>([])
  const [contenidoStatus, setContenidoStatus] = useState<ContenidoStatus[]>([])
  const [retosStatus, setRetosStatus]         = useState<RetosStatus[]>([])
  const [loading, setLoading] = useState(true)

  const [modal, setModal] = useState<{
    type: 'modul' | 'leccio' | 'subtema'
    context?: { modulId?: string; modulNom?: string; leccioId?: string; leccioNom?: string }
    saving: boolean
  } | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [indiceRes, contenidoRes, retosRes] = await Promise.all([
      fetch('/api/indice'),
      fetch('/api/contenido/historial'),
      fetch('/api/retos/listar'),
    ])
    if (indiceRes.ok) {
      const d = await indiceRes.json()
      setModuls(d.moduls ?? [])
      setLeccions(d.leccions ?? [])
      setSubtemes(d.subtemes ?? [])
    }
    if (contenidoRes.ok) {
      const d = await contenidoRes.json()
      setContenidoStatus((d.data ?? []).map((c: ContenidoStatus) => ({ modulo: c.modulo, leccion: c.leccion, subtema: c.subtema, id: c.id })))
    }
    if (retosRes.ok) {
      const d = await retosRes.json()
      setRetosStatus((d.data ?? []).map((r: RetosStatus) => ({ modulo: r.modulo, leccion: r.leccion, subtema: r.subtema })))
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleReorderModuls(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setModuls(prev => {
      const oldIdx = prev.findIndex(m => m.id === active.id)
      const newIdx = prev.findIndex(m => m.id === over.id)
      const reordered = arrayMove(prev, oldIdx, newIdx).map((m, i) => ({ ...m, ordre: i }))
      reordered.forEach(m => fetch('/api/moduls', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, ordre: m.ordre }) }))
      return reordered
    })
  }

  function handleReorderLeccions(modulId: string, event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    void modulId
    setLeccions(prev => {
      const oldIdx = prev.findIndex(l => l.id === active.id)
      const newIdx = prev.findIndex(l => l.id === over.id)
      const reordered = arrayMove(prev, oldIdx, newIdx)
      const modulNom = prev.find(l => l.id === active.id as string)?.modulo
      let order = 0
      const result = reordered.map(l => {
        if (l.modulo === modulNom) return { ...l, ordre: order++ }
        return l
      })
      result.filter(l => l.modulo === modulNom).forEach(l => fetch('/api/leccions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: l.id, ordre: l.ordre }) }))
      return result
    })
  }

  function handleReorderSubtemes(leccioId: string, newOrder: Subtema[]) {
    setSubtemes(prev => {
      const leccioNom = leccions.find(l => l.id === leccioId)?.nom
      const leccioModul = leccions.find(l => l.id === leccioId)?.modulo
      return prev.filter(s => !(s.leccion === leccioNom && s.modulo === leccioModul)).concat(newOrder)
    })
  }

  async function saveModul(nom: string) {
    setModal(prev => prev ? { ...prev, saving: true } : null)
    const ordre = moduls.length
    const res = await fetch('/api/moduls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nom, ordre }) })
    const d = await res.json()
    if (d.data) setModuls(prev => [...prev, d.data])
    setModal(null)
  }

  async function saveLeccio(nom: string) {
    if (!modal?.context?.modulNom) return
    setModal(prev => prev ? { ...prev, saving: true } : null)
    const modulo = modal.context.modulNom
    const ordre = leccions.filter(l => l.modulo === modulo).length
    const res = await fetch('/api/leccions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modulo, nom, ordre }) })
    const d = await res.json()
    if (d.data) setLeccions(prev => [...prev, d.data])
    setModal(null)
  }

  async function saveSubtema(nom: string) {
    if (!modal?.context?.modulNom || !modal?.context?.leccioNom) return
    setModal(prev => prev ? { ...prev, saving: true } : null)
    const modulo = modal.context.modulNom
    const leccion = modal.context.leccioNom
    const ordre = subtemes.filter(s => s.modulo === modulo && s.leccion === leccion).length
    const res = await fetch('/api/subtemes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modulo, leccion, nom, ordre }) })
    const d = await res.json()
    if (d.data) setSubtemes(prev => [...prev, d.data])
    setModal(null)
  }

  async function deleteModul(m: Modul) {
    if (!confirm(`Eliminar el mòdul "${m.nom}" i tot el seu contingut?`)) return
    await fetch('/api/moduls', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, nom: m.nom }) })
    setModuls(prev => prev.filter(x => x.id !== m.id))
    setLeccions(prev => prev.filter(l => l.modulo !== m.nom))
    setSubtemes(prev => prev.filter(s => s.modulo !== m.nom))
  }

  async function deleteLeccio(l: Leccio) {
    if (!confirm(`Eliminar la lliçó "${l.nom}"?`)) return
    await fetch('/api/leccions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: l.id, modulo: l.modulo, nom: l.nom }) })
    setLeccions(prev => prev.filter(x => x.id !== l.id))
    setSubtemes(prev => prev.filter(s => !(s.modulo === l.modulo && s.leccion === l.nom)))
  }

  async function deleteSubtema(s: Subtema) {
    if (!confirm(`Eliminar el subtema "${s.nom}"?`)) return
    await fetch('/api/subtemes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, modulo: s.modulo, leccion: s.leccion, nom: s.nom }) })
    setSubtemes(prev => prev.filter(x => x.id !== s.id))
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse p-6 max-w-4xl mx-auto w-full">
        <div className="h-5 bg-finomik-light2 rounded w-1/3" />
        <div className="h-4 bg-finomik-light2 rounded w-1/2 ml-4" />
        <div className="h-4 bg-finomik-light2 rounded w-2/5 ml-8" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-finomik-blue text-xl">Índex del curs</h2>
          <p className="text-finomik-mid3 text-sm mt-0.5">{moduls.length} mòduls · {subtemes.length} subtemes</p>
        </div>
        <button
          onClick={() => setModal({ type: 'modul', saving: false })}
          className="bg-finomik-blue text-white rounded-2xl px-5 py-2.5 font-extrabold text-sm hover:bg-finomik-mid1 transition"
        >
          + Nou mòdul
        </button>
      </div>

      {moduls.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="text-5xl">📚</div>
          <p className="font-extrabold text-finomik-blue text-lg">L&apos;índex és buit</p>
          <p className="text-finomik-mid3 text-sm max-w-xs">Comença afegint el primer mòdul del curs.</p>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorderModuls}>
        <SortableContext items={moduls.map(m => m.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {moduls.map(modul => {
              const modulLeccions = leccions.filter(l => l.modulo === modul.nom)
              return (
                <SortableModul
                  key={modul.id}
                  modul={modul}
                  leccions={modulLeccions}
                  subtemes={subtemes}
                  contenidoStatus={contenidoStatus}
                  retosStatus={retosStatus}
                  onSelectSubtema={onSelectSubtema}
                  onDeleteModul={() => deleteModul(modul)}
                  onAddLeccio={() => setModal({ type: 'leccio', context: { modulNom: modul.nom }, saving: false })}
                  onDeleteLeccio={deleteLeccio}
                  onAddSubtema={(l) => setModal({ type: 'subtema', context: { modulNom: modul.nom, leccioNom: l.nom }, saving: false })}
                  onDeleteSubtema={deleteSubtema}
                  onRefresh={fetchAll}
                  onReorderLeccions={(e) => handleReorderLeccions(modul.id, e)}
                  onReorderSubtemes={handleReorderSubtemes}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {modal && (
        <AddModal
          title={
            modal.type === 'modul' ? 'Nou mòdul' :
            modal.type === 'leccio' ? `Nova lliçó — ${modal.context?.modulNom}` :
            `Nou subtema — ${modal.context?.leccioNom}`
          }
          placeholder={
            modal.type === 'modul' ? 'Ex: Mòdul 1 — Els diners i jo' :
            modal.type === 'leccio' ? 'Ex: 1. Diners' :
            'Ex: 1.1 Per què existeix el diner?'
          }
          onSave={
            modal.type === 'modul' ? saveModul :
            modal.type === 'leccio' ? saveLeccio :
            saveSubtema
          }
          onCancel={() => setModal(null)}
          saving={modal.saving}
        />
      )}
    </div>
  )
}

// ── Sortable Modul ─────────────────────────────────────────────────────────
function SortableModul({ modul, leccions, subtemes, contenidoStatus, retosStatus, onSelectSubtema, onDeleteModul, onAddLeccio, onDeleteLeccio, onAddSubtema, onDeleteSubtema, onRefresh, onReorderLeccions, onReorderSubtemes }: {
  modul: Modul
  leccions: Leccio[]
  subtemes: Subtema[]
  contenidoStatus: ContenidoStatus[]
  retosStatus: RetosStatus[]
  onSelectSubtema: Props['onSelectSubtema']
  onDeleteModul: () => void
  onAddLeccio: () => void
  onDeleteLeccio: (l: Leccio) => void
  onAddSubtema: (l: Leccio) => void
  onDeleteSubtema: (s: Subtema) => void
  onRefresh: () => void
  onReorderLeccions: (e: DragEndEvent) => void
  onReorderSubtemes: (leccioId: string, newOrder: Subtema[]) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: modul.id })
  const [collapsed, setCollapsed] = useState(false)
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  return (
    <div ref={setNodeRef} style={style} className="border border-finomik-light2 rounded-2xl overflow-hidden">
      <div className="bg-finomik-blue px-5 py-3 flex items-center justify-between group/mod">
        <div className="flex items-center gap-2 flex-1">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-white/40 hover:text-white/80 transition shrink-0 touch-none">
            <GripIcon />
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2 flex-1 text-left">
            <span className="text-white text-xs opacity-70 w-4">{collapsed ? '▶' : '▼'}</span>
            <h3 className="font-black text-white text-sm">{modul.nom}</h3>
          </button>
        </div>
        <div className="flex items-center gap-3">
          {!collapsed && (
            <button onClick={onAddLeccio} className="text-finomik-gold text-xs font-extrabold hover:text-white transition shrink-0">+ Lliçó</button>
          )}
          <button onClick={onDeleteModul} className="text-red-300 hover:text-red-100 text-xs font-bold transition opacity-0 group-hover/mod:opacity-100 shrink-0">Eliminar</button>
        </div>
      </div>

      {!collapsed && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onReorderLeccions}>
          <SortableContext items={leccions.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col divide-y divide-finomik-light2">
              {leccions.length === 0 && (
                <p className="px-5 py-3 text-xs text-finomik-mid3 italic">Sense lliçons.</p>
              )}
              {leccions.map((leccio, idx) => (
                <SortableLeccio
                  key={leccio.id}
                  leccio={leccio}
                  leccioIndex={idx}
                  totalLeccions={leccions.length}
                  subtemes={subtemes.filter(s => s.modulo === modul.nom && s.leccion === leccio.nom)}
                  contenidoStatus={contenidoStatus}
                  retosStatus={retosStatus}
                  onSelectSubtema={onSelectSubtema}
                  onDeleteLeccio={() => onDeleteLeccio(leccio)}
                  onRefresh={onRefresh}
                  onAddSubtema={onAddSubtema}
                  onDeleteSubtema={onDeleteSubtema}
                  onReorderSubtemes={onReorderSubtemes}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
