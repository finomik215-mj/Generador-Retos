-- Tabla para los planes de módulo (Planificación Curricular).
-- Ejecutar en Supabase Dashboard > SQL Editor.

create table if not exists public.planificacions (
  modulo                     text primary key,
  idioma                     text        not null default 'ca',
  arco                       jsonb       not null,
  tiempo                     jsonb       not null,
  objetivos                  jsonb       not null,
  recomendaciones_estructura jsonb       not null default '[]',
  estado                     text        not null default 'propuesto',  -- propuesto | aprobado
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

-- La app entra con la service_role (salta RLS). Con RLS activado y sin policy,
-- la llave pública (anon) no puede tocar esta tabla.
alter table public.planificacions enable row level security;
