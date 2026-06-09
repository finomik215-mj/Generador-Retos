import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Falten les variables SUPABASE_URL o SUPABASE_ANON_KEY')
    _supabase = createClient(url, key)
  }
  return _supabase
}

// Alias per compatibilitat amb codi existent
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string, unknown>)[prop as string]
  },
})

export interface ContenidoAprobado {
  id: string
  modulo: string
  leccion: string
  subtema: string
  pregunta_numero: number
  pregunta_texto: string
  contenido: string
  palabras: number | null
  created_at: string
}

export interface RetoGuardado {
  id: string
  modulo: string
  leccion: string
  subtema: string
  pregunta_numero: number
  pregunta_texto: string
  tipo_reto: string
  datos: Record<string, unknown>
  aprobado: boolean
  created_at: string
}
