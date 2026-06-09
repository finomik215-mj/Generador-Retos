import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

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
