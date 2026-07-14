// ─────────────────────────────────────────────────────────────────────────────
// materialReferencia.ts
//
// Obtiene el material de referencia de un módulo. Caso especial: el Módulo General
// es transversal (cubre todos los temas), así que usa el material de TODOS los
// módulos junto, no solo el suyo.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase'

export const MODULO_GENERAL = 'Módulo General'

// Devuelve el material como texto, o null si no hay ninguno.
export async function getMaterialReferencia(modulo: string): Promise<string | null> {
  if (modulo === MODULO_GENERAL) {
    const { data } = await supabase.from('materials_referencia').select('modul, contingut')
    const rows = (data ?? []).filter(r => r.contingut)
    if (rows.length === 0) return null
    return rows.map(r => `===== MATERIAL: ${r.modul} =====\n${r.contingut}`).join('\n\n')
  }
  const { data } = await supabase
    .from('materials_referencia')
    .select('contingut')
    .eq('modul', modulo)
    .maybeSingle()
  return data?.contingut ?? null
}
