'use client'

interface ContenidoFormProps {
  modulo: string
  leccion: string
  subtema: string
  preguntas: string
  palabras: number
  onChange: (field: string, value: string | number) => void
  disabled: boolean
}

export default function ContenidoForm({
  modulo,
  leccion,
  subtema,
  preguntas,
  palabras,
  onChange,
  disabled,
}: ContenidoFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">
          Mòdul
        </label>
        <input
          type="text"
          value={modulo}
          onChange={e => onChange('modulo', e.target.value)}
          disabled={disabled}
          placeholder="Ex: Mòdul 1 — Els diners i jo"
          className="border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue placeholder:text-finomik-mid3 focus:outline-none focus:ring-2 focus:ring-finomik-blue/20 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">
          Lliçó
        </label>
        <input
          type="text"
          value={leccion}
          onChange={e => onChange('leccion', e.target.value)}
          disabled={disabled}
          placeholder="Ex: Lliçó 3 — El pressupost personal"
          className="border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue placeholder:text-finomik-mid3 focus:outline-none focus:ring-2 focus:ring-finomik-blue/20 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">
          Subtema
        </label>
        <input
          type="text"
          value={subtema}
          onChange={e => onChange('subtema', e.target.value)}
          disabled={disabled}
          placeholder="Ex: 1.3.2 Despeses fixes i variables"
          className="border border-finomik-light2 rounded-xl px-4 py-2.5 text-sm text-finomik-blue placeholder:text-finomik-mid3 focus:outline-none focus:ring-2 focus:ring-finomik-blue/20 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">
          Preguntes clau
          <span className="ml-1 text-finomik-mid3 font-normal normal-case tracking-normal">
            (una per línia)
          </span>
        </label>
        <textarea
          value={preguntas}
          onChange={e => onChange('preguntas', e.target.value)}
          disabled={disabled}
          rows={4}
          placeholder={`Què és una despesa fixa?\nQuina diferència hi ha amb una despesa variable?\nCom afecta això al meu pressupost?`}
          className="border border-finomik-light2 rounded-xl px-4 py-3 text-sm text-finomik-blue placeholder:text-finomik-mid3 focus:outline-none focus:ring-2 focus:ring-finomik-blue/20 disabled:opacity-50 resize-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-extrabold text-finomik-blue uppercase tracking-wide">
          Objectiu de paraules
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={100}
            max={600}
            step={50}
            value={palabras}
            onChange={e => onChange('palabras', Number(e.target.value))}
            disabled={disabled}
            className="flex-1 accent-finomik-blue"
          />
          <span className="text-sm font-extrabold text-finomik-blue w-16 text-right">
            {palabras} pal.
          </span>
        </div>
      </div>
    </div>
  )
}
