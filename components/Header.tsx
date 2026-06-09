'use client'

export default function Header() {
  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <header className="bg-finomik-blue px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-finomik-gold font-black text-2xl tracking-tight">
          Finomik
        </span>
        <span className="text-finomik-light2 text-sm font-medium hidden sm:block">
          Generador de Reptes
        </span>
      </div>
      <button
        onClick={handleLogout}
        className="text-finomik-light2 hover:text-white text-sm font-medium transition"
      >
        Tancar sessió
      </button>
    </header>
  )
}
