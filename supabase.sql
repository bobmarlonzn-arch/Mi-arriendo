-- Pega todo esto en Supabase > SQL Editor > Run

create table if not exists apartamentos (
  id bigint generated always as identity primary key,
  nombre text not null,
  direccion text,
  caracteristicas text,
  valor integer not null default 0,
  fotos text[] not null default '{}',
  estado text not null default 'Disponible' check (estado in ('Disponible','Ocupado','Agendado'))
);

create table if not exists inquilinos (
  id bigint generated always as identity primary key,
  nombre text not null,
  cedula text,
  celular text not null,
  apartamento_id bigint references apartamentos(id),
  dia_pago smallint not null check (dia_pago between 1 and 31),
  activo boolean not null default true
);

create table if not exists pagos (
  id bigint generated always as identity primary key,
  inquilino_id bigint not null references inquilinos(id),
  periodo char(7) not null,                 -- 'AAAA-MM'
  valor integer not null default 0,
  fecha_pago timestamptz not null default now(),
  comprobante_url text,
  unique (inquilino_id, periodo)
);

create table if not exists comprobantes (
  id bigint generated always as identity primary key,
  inquilino_id bigint references inquilinos(id),
  telefono text,
  archivo_url text not null,
  fecha_recepcion timestamptz not null default now(),
  estado text not null default 'Pendiente' check (estado in ('Pendiente','Confirmado')),
  wamid text unique
);

-- Control de recordatorios (evita duplicados y permite reintentos)
create table if not exists recordatorios (
  inquilino_id bigint not null references inquilinos(id),
  periodo char(7) not null,
  enviado boolean not null default false,
  error text,
  actualizado timestamptz not null default now(),
  primary key (inquilino_id, periodo)
);

-- Seguridad: solo el servidor (service_role) accede a las tablas
alter table apartamentos enable row level security;
alter table inquilinos enable row level security;
alter table pagos enable row level security;
alter table comprobantes enable row level security;
alter table recordatorios enable row level security;

-- Bucket público "comprobantes" (también guarda fotos de apartamentos)
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', true)
on conflict (id) do update set public = true;
