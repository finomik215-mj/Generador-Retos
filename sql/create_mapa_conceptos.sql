-- Mapa de reparto de conceptos del curso (una sola fila).
-- Cada concepto recurrente tiene una pieza dueña y una lista de reapariciones.

create table if not exists public.mapa_conceptos (
  id          text primary key default 'curso',
  conceptos   jsonb not null default '[]'::jsonb,
  estado      text not null default 'propuesto',
  updated_at  timestamptz not null default now()
);

alter table public.mapa_conceptos enable row level security;

-- Sin políticas: solo accesible con la service key desde el servidor (API routes),
-- igual que fichas, planificacions y conexiones_curriculares.
