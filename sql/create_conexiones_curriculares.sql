-- Guía de adaptación curricular por módulo (una fila por módulo).
-- El contenido (intro + bloques) se guarda como JSON.

create table if not exists public.conexiones_curriculares (
  modulo      text primary key,
  intro       text,
  bloques     jsonb not null default '[]'::jsonb,
  estado      text not null default 'propuesto',
  updated_at  timestamptz not null default now()
);

alter table public.conexiones_curriculares enable row level security;

-- Sin políticas: solo accesible con la service key desde el servidor (API routes),
-- igual que fichas y planificacions.
