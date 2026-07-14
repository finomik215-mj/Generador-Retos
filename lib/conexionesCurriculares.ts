// ─────────────────────────────────────────────────────────────────────────────
// conexionesCurriculares.ts
//
// Datos fijos para la guía de adaptación curricular del módulo de Economía.
// Las "conexiones curriculares" están tomadas literalmente del temario de Finomik
// (una por bloque). El currículo oficial es el índice del libro de texto estándar
// de Economía 1º de Bachillerato (14 unidades) que sirve de referencia.
//
// Solo Economía se conecta a un currículo oficial de Bachillerato; los demás
// módulos no usan este sistema.
// ─────────────────────────────────────────────────────────────────────────────

export const MODULO_ECONOMIA = 'Economía 1º de Bachillerato'

// Índice oficial del currículo de Economía 1º de Bachillerato (libro de texto estándar).
export const CURRICULO_ECONOMIA = `CURRÍCULO OFICIAL — Economía 1º de Bachillerato (14 unidades)
1. Economía: la ciencia de las decisiones (decisores, decisiones y recursos; escoger es renunciar; economía conductual)
2. Crecimiento y organización económica
3. La producción (costes, ingresos y beneficios; cómo producir; objetivos de las empresas)
4. El mercado (mercado y demanda; equilibrio del mercado; elasticidad-precio)
5. Tipos de mercado (competencia; diferenciación de producto)
6. El mercado de trabajo (mercado de trabajo; productividad y salarios; desempleo; evolución del mercado laboral y empleo)
7. El papel del Estado (Estado del bienestar)
8. Indicadores y equilibrio macroeconómico (ahorro)
9. Las cuentas del Estado (política fiscal; presupuestos generales del Estado; sostenibilidad de las pensiones)
10. El dinero y la política monetaria (precios e inflación; indicadores de la inflación; política monetaria; ciberseguridad)
11. El sistema financiero. La Bolsa (sistema financiero; intermediarios financieros bancarios; productos financieros; mercados o bolsas de valores)
12. El comercio internacional
13. Unión Europea y globalización
14. Desequilibrios de la economía mundial`

// Conexión curricular por bloque, EXACTAMENTE como aparece en el temario de Finomik.
// La clave es el nombre exacto del bloque en Supabase (carácter por carácter).
export const CONEXIONES_ECONOMIA: Record<string, string> = {
  'Aprender a decidir en qué gastar tu dinero':
    'Unidad 1. Economía: la ciencia de las decisiones: decisores, decisiones y recursos; escoger es renunciar; economía conductual.',
  'Entender qué pagas y por qué lo pagas':
    'Unidad 4. El mercado: mercado y demanda, equilibrio del mercado y elasticidad-precio. Unidad 5. Tipos de mercado: competencia y diferenciación de producto.',
  'Empresas que venden mucho y ganan poco':
    'Unidad 3. La producción: costes, ingresos y beneficios; cómo producir; objetivos de las empresas.',
  'Primeros pasos en el mundo laboral':
    'Unidad 6. El mercado de trabajo: mercado de trabajo, productividad y salarios, desempleo, evolución del mercado laboral y empleo.',
  'Los impuestos que ya pagas sin darte cuenta':
    'Unidad 7. El papel del Estado: Estado del bienestar. Unidad 9. Las cuentas del Estado: política fiscal, presupuestos generales del Estado y sostenibilidad de las pensiones.',
  'El dinero que pierde valor sin moverse':
    'Unidad 8. Indicadores y equilibrio macroeconómico: ahorro. Unidad 10. El dinero y la política monetaria: precios e inflación, indicadores de la inflación y política monetaria.',
  'Deuda que ayuda y deuda que atrapa':
    'Unidad 11. El sistema financiero. La Bolsa: sistema financiero, intermediarios financieros bancarios y productos financieros.',
  'Entender la inversión antes de poner dinero':
    'Unidad 10. El dinero y la política monetaria: ciberseguridad. Unidad 11. El sistema financiero. La Bolsa: productos financieros y mercados o bolsas de valores.',
}
