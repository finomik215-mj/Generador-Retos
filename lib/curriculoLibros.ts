// ─────────────────────────────────────────────────────────────────────────────
// curriculoLibros.ts
//
// Índices REALES de los libros de texto oficiales y el mapeo de cada bloque de
// Finomik a la(s) unidad(es) y apartados del libro. Se usa para inyectar en las
// instrucciones de contenido (el brief que se copia a ChatGPT) de los módulos de
// Economía, para que el contenido respete la estructura real de la asignatura.
//
// Solo constantes puras: seguro de importar desde componentes cliente.
// ─────────────────────────────────────────────────────────────────────────────

export const MODULO_ECONOMIA_BACH = 'Economía 1º de Bachillerato'
export const MODULO_ECONOMIA_ESO = 'Economía 4º de ESO'

// Índice oficial completo (unidad → apartados), como referencia global.
export const INDICE_LIBRO_BACH = `LIBRO OFICIAL — Economía 1º de Bachillerato
U1. Economía: la ciencia de las decisiones: ¿qué es la economía?; elegir es renunciar; decisores, decisiones y recursos; el estudio de la economía; (otras miradas: economía conductual)
U2. Crecimiento y organización: posibilidades de producción; crecimiento económico; sistemas económicos; (economía circular)
U3. La producción: función de producción; ¿cómo producir?; costes, ingresos y beneficios; objetivos de las empresas; RSC; sectores económicos
U4. El mercado: el mercado y la demanda; la oferta; el equilibrio del mercado; la elasticidad-precio
U5. Tipos de mercado: mercado y competencia; competencia perfecta; competencia monopolística; oligopolio; monopolio
U6. El mercado de trabajo: mercado de trabajo; productividad y salarios; el desempleo; estadísticas de empleo; políticas de empleo; evolución del mercado laboral
U7. El papel del Estado: fallos del mercado; el estado del bienestar; política macroeconómica
U8. Indicadores y equilibrio macroeconómico: crecimiento y producción; la economía en su conjunto; el consumo; la inversión; el ahorro
U9. Las cuentas del Estado: la política fiscal; los presupuestos generales del Estado; (sostenibilidad de las pensiones)
U10. El dinero y la política monetaria: el dinero; precios e inflación; indicadores de la inflación; la política monetaria; el BCE; (ciberseguridad)
U11. El sistema financiero. La Bolsa: el sistema financiero; intermediarios financieros bancarios; productos financieros; mercados o Bolsas de valores
U12. El comercio internacional
U13. Unión Europea y globalización
U14. Desequilibrios de la economía mundial`

export const INDICE_LIBRO_ESO = `LIBRO OFICIAL — Economía 4º de ESO
U1. La economía de las personas: ¿qué es la economía?; elegir es renunciar; el comportamiento de las personas
U2. Producción, renta y comercio: el estudio de la economía; la producción y sus posibilidades; mercados y rentas; el comercio y las desigualdades; (herramientas: la productividad; derechos y deberes de los consumidores)
U3. Planificación financiera: el dinero y las cuentas bancarias; las tarjetas; el presupuesto; la jubilación y los planes de pensiones
U4. Salud financiera: el sistema financiero; las inversiones; las deudas; el contrato de seguro; (herramientas: seguridad de tarjetas y online; calidad y nivel de endeudamiento)
U5. La función de las empresas: los objetivos de las empresas; la responsabilidad social corporativa; los sectores económicos
U6. La organización empresarial: tipos de empresas; elementos de la empresa; financiación empresarial; obligaciones de las empresas; (herramientas: tecnología; crowdfunding)
U7. Entorno social, ambiental y cultural: sostenibilidad; de la economía lineal a la circular; el cambio comienza por nosotros; emprendimiento cultural y artístico
U8. El emprendimiento · U9. El trabajo en equipo · U10. Creando tu negocio · U11. La puesta en marcha del negocio`

// Mapeo bloque de Finomik → unidad(es) y apartados del libro real.
const CONEXION_BACH: Record<string, string> = {
  'Aprender a decidir en qué gastar tu dinero':
    'U1. Economía: la ciencia de las decisiones → ¿qué es la economía?; elegir es renunciar; decisores, decisiones y recursos; economía conductual.',
  'Entender qué pagas y por qué lo pagas':
    'U4. El mercado → el mercado y la demanda; la oferta; el equilibrio del mercado; la elasticidad-precio. U5. Tipos de mercado → competencia; competencia perfecta, monopolística, oligopolio, monopolio.',
  'Empresas que venden mucho y ganan poco':
    'U3. La producción → costes, ingresos y beneficios; ¿cómo producir?; objetivos de las empresas; RSC; sectores económicos.',
  'Primeros pasos en el mundo laboral':
    'U6. El mercado de trabajo → mercado de trabajo; productividad y salarios; desempleo; estadísticas y políticas de empleo; evolución del mercado laboral.',
  'Los impuestos que ya pagas sin darte cuenta':
    'U7. El papel del Estado → fallos del mercado; estado del bienestar; política macroeconómica. U9. Las cuentas del Estado → política fiscal; presupuestos generales del Estado; sostenibilidad de las pensiones.',
  'El dinero que pierde valor sin moverse':
    'U8. Indicadores y equilibrio macroeconómico → el ahorro; el consumo; la inversión. U10. El dinero y la política monetaria → precios e inflación; indicadores de la inflación; política monetaria; el BCE.',
  'Deuda que ayuda y deuda que atrapa':
    'U11. El sistema financiero. La Bolsa → el sistema financiero; intermediarios financieros bancarios; productos financieros.',
  'Entender la inversión antes de poner dinero':
    'U11. El sistema financiero. La Bolsa → productos financieros; mercados o Bolsas de valores. U10 → ciberseguridad.',
}

const CONEXION_ESO: Record<string, string> = {
  'Entender cómo funciona la economía':
    'U1. La economía de las personas → ¿qué es la economía?; elegir es renunciar; el comportamiento de las personas.',
  'De los recursos a los productos que consumimos':
    'U2. Producción, renta y comercio → el estudio de la economía; la producción y sus posibilidades; herramientas: la productividad.',
  'Cómo circula el dinero en la economía':
    'U2. Producción, renta y comercio → mercados y rentas; relación entre producción, ingresos e intercambio.',
  'Comercio, consumo y desigualdad':
    'U2. Producción, renta y comercio → el comercio y las desigualdades; derechos y deberes de los consumidores.',
  'Cómo funciona el sistema financiero':
    'U3. Planificación financiera → el dinero y las cuentas bancarias; las tarjetas; el presupuesto; la jubilación y los planes de pensiones. U4. Salud financiera → el sistema financiero; las deudas; las inversiones; el contrato de seguro.',
  'Decisiones económicas que miran al futuro':
    'U3. Planificación financiera → el presupuesto; jubilación y planes de pensiones. U4. Salud financiera → inversiones; deudas; contrato de seguro; calidad y nivel de endeudamiento.',
  'Entender qué hace una empresa':
    'U5. La función de las empresas → los objetivos de las empresas; la responsabilidad social corporativa; los sectores económicos.',
  'Cómo se organiza y financia una empresa':
    'U6. La organización empresarial → tipos de empresas; elementos de la empresa; financiación empresarial; obligaciones de las empresas; herramientas: tecnología y crowdfunding.',
  'Empresas y decisiones sostenibles':
    'U7. Entorno social, ambiental y cultural → sostenibilidad; de la economía lineal a la circular; el cambio comienza por nosotros; emprendimiento cultural y artístico.',
}

// ¿Este módulo tiene un libro oficial detrás?
export function tieneCurriculoLibro(modulo: string): boolean {
  return modulo === MODULO_ECONOMIA_BACH || modulo === MODULO_ECONOMIA_ESO
}

// Índice oficial completo del libro del módulo, o null.
export function getCurriculoLibro(modulo: string): string | null {
  if (modulo === MODULO_ECONOMIA_BACH) return INDICE_LIBRO_BACH
  if (modulo === MODULO_ECONOMIA_ESO) return INDICE_LIBRO_ESO
  return null
}

// Devuelve la conexión (unidad + apartados) del bloque con el libro real, o null.
export function getConexionLibro(modulo: string, bloque: string): string | null {
  if (modulo === MODULO_ECONOMIA_BACH) return CONEXION_BACH[bloque] ?? null
  if (modulo === MODULO_ECONOMIA_ESO) return CONEXION_ESO[bloque] ?? null
  return null
}
