interface ContentInputProps {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}

export default function ContentInput({ value, onChange, disabled }: ContentInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-extrabold text-finomik-blue text-sm uppercase tracking-wide">
        Contingut de la lliçó
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Enganxa aquí el contingut de la lliçó..."
        className="border border-finomik-light2 rounded-xl px-4 py-3 text-sm text-finomik-blue placeholder-finomik-light1 focus:outline-none focus:ring-2 focus:ring-finomik-blue resize-y min-h-[300px] disabled:opacity-60"
      />
    </div>
  )
}
