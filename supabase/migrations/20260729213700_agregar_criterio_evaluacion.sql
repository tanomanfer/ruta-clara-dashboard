-- Agrega preferencia de criterio de evaluación (km u hora) al perfil del chofer.

create type public.criterio_rentabilidad as enum ('km', 'hora');

alter table public.perfiles
  add column criterio_evaluacion public.criterio_rentabilidad not null default 'km';
