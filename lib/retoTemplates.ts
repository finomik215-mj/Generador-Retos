export interface RetoField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'option_list' | 'boolean'
  placeholder?: string
  options?: string[]
}

export interface RetoTemplate {
  id: number
  nombre: string
  descripcion: string
  fields: RetoField[]
}

export const RETO_TEMPLATES: RetoTemplate[] = [
  {
    id: 1,
    nombre: 'Quiz ràpid multi-opció',
    descripcion: "L'usuari tria entre 3 o 4 opcions amb conseqüències diferents.",
    fields: [
      { key: 'enunciado', label: 'Enunciat', type: 'textarea', placeholder: 'Què faries si...?' },
      { key: 'opcion_a', label: 'Opció A', type: 'text', placeholder: 'Primera opció' },
      { key: 'opcion_b', label: 'Opció B', type: 'text', placeholder: 'Segona opció' },
      { key: 'opcion_c', label: 'Opció C', type: 'text', placeholder: 'Tercera opció' },
      { key: 'opcion_d', label: 'Opció D (opcional)', type: 'text', placeholder: 'Quarta opció' },
      { key: 'correcta', label: 'Resposta correcta', type: 'select', options: ['A', 'B', 'C', 'D'] },
      { key: 'feedback_correcto', label: 'Feedback si encerta', type: 'textarea', placeholder: 'Explica per què és correcta...' },
      { key: 'feedback_incorrecto', label: 'Feedback si falla', type: 'textarea', placeholder: "Explica l'error..." },
    ],
  },
  {
    id: 2,
    nombre: 'Distribució',
    descripcion: "L'usuari assigna recursos entre categories.",
    fields: [
      { key: 'enunciado', label: 'Enunciat', type: 'textarea', placeholder: 'Tens 500€, com els reparteixes?' },
      { key: 'recurso', label: 'Recurs a distribuir', type: 'text', placeholder: 'Ex: 500€ al mes' },
      { key: 'categorias', label: 'Categories (una per línia)', type: 'textarea', placeholder: 'Estalvi\nDespeses fixes\nOci' },
      { key: 'distribucion_ideal', label: 'Distribució ideal', type: 'textarea', placeholder: 'Ex: 20% estalvi, 50% fixes, 30% oci' },
      { key: 'feedback_correcto', label: 'Feedback bona distribució', type: 'textarea' },
      { key: 'feedback_incorrecto', label: 'Feedback mala distribució', type: 'textarea' },
    ],
  },
  {
    id: 3,
    nombre: 'Ordenació',
    descripcion: "L'usuari prioritza opcions sense quantitat fixa.",
    fields: [
      { key: 'enunciado', label: 'Enunciat', type: 'textarea', placeholder: 'En quin ordre pagaries aquests deutes?' },
      { key: 'elementos', label: 'Elements a ordenar (un per línia)', type: 'textarea', placeholder: 'Deute amb targeta\nPréstec del cotxe\nFactura del mòbil' },
      { key: 'orden_correcto', label: 'Ordre correcte', type: 'textarea', placeholder: "Explica l'ordre òptim..." },
      { key: 'feedback_correcto', label: 'Feedback si encerta', type: 'textarea' },
      { key: 'feedback_incorrecto', label: 'Feedback si falla', type: 'textarea' },
    ],
  },
  {
    id: 4,
    nombre: 'Conseqüència immediata',
    descripcion: 'Mostra el resultat directe d\'una decisió.',
    fields: [
      { key: 'decision', label: 'Decisió presa', type: 'textarea', placeholder: "L'usuari va decidir gastar en..." },
      { key: 'consecuencia', label: 'Conseqüència immediata', type: 'textarea', placeholder: 'Com a resultat...' },
      { key: 'impacto', label: 'Impacte en el perfil', type: 'text', placeholder: 'Ex: -50€ en fons d\'emergència' },
    ],
  },
  {
    id: 5,
    nombre: 'Esdeveniment inesperat',
    descripcion: 'Un imprevist interromp i obliga a reaccionar.',
    fields: [
      { key: 'situacion', label: 'Situació inesperada', type: 'textarea', placeholder: "Se t'espatlla la bici i necessites 150€..." },
      { key: 'opciones', label: 'Opcions de reacció (una per línia)', type: 'textarea', placeholder: "Usar el fons d'emergència\nDemanar prestat\nNo arreglar-ho" },
      { key: 'opcion_correcta', label: 'Opció recomanada', type: 'text' },
      { key: 'feedback', label: 'Feedback', type: 'textarea' },
    ],
  },
  {
    id: 6,
    nombre: 'Conseqüència diferida',
    descripcion: "Revela l'impacte d'una decisió anterior.",
    fields: [
      { key: 'decision_anterior', label: 'Decisió presa abans', type: 'textarea', placeholder: 'A la lliçó anterior vas decidir...' },
      { key: 'consecuencia', label: 'Conseqüència ara', type: 'textarea', placeholder: 'Han passat 3 mesos i...' },
      { key: 'leccion', label: 'Lliçó apresa', type: 'textarea' },
    ],
  },
  {
    id: 7,
    nombre: 'Vertader / Fals',
    descripcion: "L'usuari avalua si una afirmació és correcta.",
    fields: [
      { key: 'afirmacion', label: 'Afirmació', type: 'textarea', placeholder: '"L\'interès compost funciona millor a curt termini"' },
      { key: 'respuesta', label: 'Resposta correcta', type: 'select', options: ['Vertader', 'Fals'] },
      { key: 'feedback_correcto', label: 'Feedback si encerta', type: 'textarea', placeholder: 'Correcte perquè...' },
      { key: 'feedback_incorrecto', label: 'Feedback si falla', type: 'textarea', placeholder: 'En realitat...' },
    ],
  },
  {
    id: 8,
    nombre: 'Omplir buits',
    descripcion: "L'usuari completa frases amb conceptes clau.",
    fields: [
      { key: 'frase', label: 'Frase amb buit (___ per indicar el buit)', type: 'textarea', placeholder: "L'interès compost funciona millor a ___ termini." },
      { key: 'respuesta', label: 'Resposta correcta', type: 'text', placeholder: 'llarg' },
      { key: 'alternativas', label: 'Alternatives incorrectes (una per línia)', type: 'textarea', placeholder: 'curt\nmitjà' },
      { key: 'feedback', label: 'Feedback explicatiu', type: 'textarea' },
    ],
  },
  {
    id: 9,
    nombre: 'Matching / Emparellar',
    descripcion: "L'usuari emparella conceptes amb les seves definicions.",
    fields: [
      { key: 'enunciado', label: 'Enunciat', type: 'textarea', placeholder: 'Emparella cada concepte amb la seva definició' },
      { key: 'pares', label: 'Parells a emparellar (format "A:B", un per línia)', type: 'textarea', placeholder: "Interès compost:L'interès que genera interès\nFons d'emergència:Diners guardats per a imprevistos" },
      { key: 'feedback', label: 'Feedback general', type: 'textarea' },
    ],
  },
  {
    id: 10,
    nombre: 'Càlcul guiat',
    descripcion: "L'usuari resol un càlcul simple pas a pas.",
    fields: [
      { key: 'enunciado', label: 'Enunciat del problema', type: 'textarea', placeholder: "Tens 1.000€ i els inverteixes al 5% anual. Quant tindràs en 3 anys?" },
      { key: 'pasos', label: 'Passos de resolució (un per línia)', type: 'textarea', placeholder: 'Any 1: 1000 × 1,05 = 1050€\nAny 2: 1050 × 1,05 = 1102,5€\nAny 3: 1102,5 × 1,05 = 1157,6€' },
      { key: 'resultado', label: 'Resultat correcte', type: 'text', placeholder: '1.157,6€' },
      { key: 'feedback', label: 'Feedback explicatiu', type: 'textarea' },
    ],
  },
  {
    id: 11,
    nombre: 'Elecció binària amb pressió',
    descripcion: "L'usuari decideix entre 2 opcions amb límit de temps.",
    fields: [
      { key: 'situacion', label: 'Situació', type: 'textarea', placeholder: 'Tens 10 segons per decidir...' },
      { key: 'opcion_a', label: 'Opció A', type: 'text' },
      { key: 'opcion_b', label: 'Opció B', type: 'text' },
      { key: 'opcion_correcta', label: 'Opció recomanada', type: 'select', options: ['A', 'B', 'Cap (depèn)'] },
      { key: 'feedback_a', label: 'Feedback si tria A', type: 'textarea' },
      { key: 'feedback_b', label: 'Feedback si tria B', type: 'textarea' },
      { key: 'tiempo_segundos', label: 'Límit de temps (segons)', type: 'text', placeholder: '10' },
    ],
  },
  {
    id: 12,
    nombre: 'Predicció',
    descripcion: "L'usuari anticipa què passarà abans de veure el resultat.",
    fields: [
      { key: 'pregunta', label: 'Pregunta de predicció', type: 'textarea', placeholder: 'Què creus que passarà si no pagues aquest deute durant 3 mesos?' },
      { key: 'opciones', label: 'Opcions de predicció (una per línia)', type: 'textarea', placeholder: 'Res important\nAugmentarà amb interessos\nEt trucaran del banc' },
      { key: 'respuesta_correcta', label: 'Resposta correcta', type: 'text' },
      { key: 'revelacion', label: 'Revelació del resultat real', type: 'textarea' },
      { key: 'feedback', label: 'Feedback', type: 'textarea' },
    ],
  },
  {
    id: 13,
    nombre: 'Mini-cas / Història curta',
    descripcion: 'Petita narrativa amb una decisió clau al final.',
    fields: [
      { key: 'historia', label: 'Història', type: 'textarea', placeholder: "L'Elena té 16 anys i acaba de rebre 200€ de regal d'aniversari..." },
      { key: 'decision', label: 'Pregunta de decisió', type: 'textarea', placeholder: 'Què hauria de fer l\'Elena?' },
      { key: 'opciones', label: 'Opcions (una per línia)', type: 'textarea', placeholder: 'Gastar-ho en roba\nEstalviar-ho tot\nEstalviar una part i gastar l\'altra' },
      { key: 'opcion_correcta', label: 'Opció recomanada', type: 'text' },
      { key: 'feedback_correcto', label: 'Feedback si encerta', type: 'textarea' },
      { key: 'feedback_incorrecto', label: 'Feedback si falla', type: 'textarea' },
    ],
  },
]
