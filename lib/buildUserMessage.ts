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
