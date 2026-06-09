'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    setLoading(false)

    if (res.ok) {
      router.push('/')
    } else {
      setError('Contrasenya incorrecta')
    }
  }

  return (
    <main className="min-h-screen bg-finomik-blue flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-sm">
        <h1 className="font-black text-3xl text-finomik-blue text-center mb-2">
          Finomik
        </h1>
        <p className="text-center text-finomik-mid1 text-sm mb-8 font-medium">
          Generador de Reptes Educatius
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contrasenya"
            className="border border-finomik-light2 rounded-lg px-4 py-3 text-finomik-blue placeholder-finomik-light1 focus:outline-none focus:ring-2 focus:ring-finomik-blue"
            required
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="bg-finomik-gold text-finomik-blue font-extrabold py-3 rounded-lg hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Entrant...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
