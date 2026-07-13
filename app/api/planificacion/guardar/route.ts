import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { PlanModul } from '@/lib/systemPromptPlanificacion'

export async function POST(req: NextRequest) {
  if (req.cookies.get('session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  }

  const { plan, estado = 'propuesto' } = await req.json() as {
    plan: PlanModul; estado?: 'propuesto' | 'aprobado'
  }

  if (!plan?.modulo) {
    return NextResponse.json({ error: 'Falta el pla' }, { status: 400 })
  }

  const { error } = await supabase.from('planificacions').upsert({
    modulo: plan.modulo,
    idioma: plan.idioma ?? 'ca',
    arco: plan.arco,
    tiempo: plan.tiempo,
    objetivos: plan.objetivos,
    recomendaciones_estructura: plan.recomendacionesEstructura ?? [],
    estado,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'modulo' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, estado })
}
