-- Tabla para las fichas didácticas (una por objetivo de aprendizaje del plan).
-- Ejecutar en Supabase Dashboard > SQL Editor.

create table if not exists public.fichas (
  modulo            text        not null,
  orden             int         not null,       -- ordre de l'objectiu dins del pla
  idioma            text        not null default 'ca',
  objetivo          text        not null,        -- còpia de l'objectiu (context)
  partida           text,                        -- la creença/intuïció/llacuna concreta
  colision_o_ancla  text,                        -- la grieta (obstacle) o l'ancoratge (llacuna)
  recurso_central   text,                        -- exemple / analogia / comparació
  orden_explicacion jsonb       not null default '[]',
  incluidos         jsonb       not null default '[]',
  excluidos         jsonb       not null default '[]',
  evidencia_logro   text,
  estado            text        not null default 'propuesto',  -- propuesto | aprobado
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (modulo, orden)
);

alter table public.fichas enable row level security;
