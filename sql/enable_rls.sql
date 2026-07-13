-- Activar RLS (cerrojo) en las tablas que estaban abiertas.
-- La app usa la service_role (llave de administrador), que salta el RLS,
-- así que no hace falta ninguna policy: con esto la llave pública (anon)
-- deja de poder tocar estas tablas y desaparecen los avisos CRITICAL.
-- Ejecutar en Supabase Dashboard > SQL Editor.

ALTER TABLE public.curso_estructura   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contenido_aprobado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retos_guardados    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moduls             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leccions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtemes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preguntes          ENABLE ROW LEVEL SECURITY;
