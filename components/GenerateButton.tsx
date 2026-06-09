interface GenerateButtonProps {
  onClick: () => void
  disabled: boolean
  loading: boolean
}

export default function GenerateButton({ onClick, disabled, loading }: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-finomik-gold text-finomik-blue font-extrabold py-3 rounded-xl hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {loading ? 'Generant...' : 'Generar reptes'}
    </button>
  )
}
