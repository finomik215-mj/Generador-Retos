const RETO_TYPES = [
  { id: 1,  label: 'Quiz ràpid multi-opció' },
  { id: 2,  label: 'Distribució' },
  { id: 3,  label: 'Ordenació' },
  { id: 4,  label: 'Conseqüència immediata' },
  { id: 5,  label: 'Esdeveniment inesperat' },
  { id: 6,  label: 'Conseqüència diferida' },
  { id: 7,  label: 'Vertader / Fals' },
  { id: 8,  label: 'Omplir buits' },
  { id: 9,  label: 'Matching / Emparellar' },
  { id: 10, label: 'Càlcul guiat' },
  { id: 11, label: 'Elecció binària amb pressió' },
  { id: 12, label: 'Predicció' },
  { id: 13, label: 'Mini-cas / Història curta' },
]

interface TypeSelectorProps {
  recommended: boolean
  selected: number[]
  onRecommendedChange: (v: boolean) => void
  onSelectedChange: (v: number[]) => void
  disabled: boolean
}

export default function TypeSelector({
  recommended,
  selected,
  onRecommendedChange,
  onSelectedChange,
  disabled,
}: TypeSelectorProps) {
  function toggleType(id: number) {
    if (selected.includes(id)) {
      onSelectedChange(selected.filter(x => x !== id))
    } else {
      onSelectedChange([...selected, id])
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="font-extrabold text-finomik-blue text-sm uppercase tracking-wide">
        Tipus de repte
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={recommended}
          onChange={e => onRecommendedChange(e.target.checked)}
          disabled={disabled}
          className="accent-finomik-gold w-4 h-4"
        />
        <span className="font-extrabold text-finomik-blue text-sm">
          Selecció recomanada per IA
        </span>
      </label>

      <div className="grid grid-cols-1 gap-2 pl-1">
        {RETO_TYPES.map(rt => (
          <label
            key={rt.id}
            className={`flex items-center gap-3 cursor-pointer ${recommended || disabled ? 'opacity-40 pointer-events-none' : ''}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(rt.id)}
              onChange={() => toggleType(rt.id)}
              disabled={recommended || disabled}
              className="accent-finomik-blue w-4 h-4"
            />
            <span className="text-sm text-finomik-mid1">
              {rt.id}. {rt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
