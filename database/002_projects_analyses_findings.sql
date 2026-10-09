-- CodePilot — 002_projects_analyses_findings
--
-- Idempotente: pode rodar em banco já populado ou vazio.
-- Tabelas que já existem (projects, analyses) não são recriadas; apenas
-- colunas novas são adicionadas.

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users (id) on delete cascade,
  name        text not null,
  github_url  text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_projects_user on projects (user_id);
create index if not exists idx_projects_user_created on projects (user_id, created_at desc);

-- O serviço já bloqueia duplicata por usuário+repo; isso evita corrida
-- entre duas requisições simultâneas.
create unique index if not exists uq_projects_user_repo
  on projects (user_id, github_url);

-- ---------------------------------------------------------------------------
-- analyses
-- ---------------------------------------------------------------------------
create table if not exists analyses (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid not null references projects (id) on delete cascade,
  score                 integer not null default 0,
  architecture_score    integer not null default 0,
  security_score        integer not null default 0,
  performance_score     integer not null default 0,
  maintainability_score integer not null default 0,
  documentation_score   integer not null default 0,
  ai_summary            text,
  created_at            timestamptz not null default now()
);

create index if not exists idx_analyses_project on analyses (project_id, created_at desc);

-- Fase 1: seletor de modelo. Default mantém compatibilidade com as
-- análises já gravadas (que sempre usaram gpt-oss-20b).
alter table analyses add column if not exists model text default 'openai/gpt-oss-20b';
alter table analyses add column if not exists status text default 'completed';

-- Fase 2: visão de arquivos críticos na página de detalhes.
alter table analyses add column if not exists critical_files jsonb default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- issues — achados por linha (Fase 2)
--
-- A tabela já existia no banco, criada manualmente e nunca referenciada
-- pelo código. Mantemos o formato original (severity/category/file/line/
-- title/description/suggestion) e fechamos três lacunas:
--
--   1. severity aceitava só high/medium/low. Segredo exposto e uso de
--      eval precisam de 'critical', e ruído informational de 'info'.
--   2. Não havia coluna para o comentário da IA, que é o dado que a Fase 2
--      mais consome (description/suggestion são estáticos, vêm da regra).
--   3. O id usava uuid_generate_v4(), que depende da extensão uuid-ossp.
--      Essa extensão não está no 001_init.sql (só pgcrypto), então a
--      tabela não seria criada num Postgres novo. Passamos a usar
--      gen_random_uuid() do pgcrypto.
-- ---------------------------------------------------------------------------
create table if not exists issues (
  id          uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references analyses (id) on delete cascade,
  severity    varchar not null default 'info',
  category    varchar,
  rule_id     text,
  file        varchar not null,
  line        integer not null,
  title       varchar not null,
  description text,
  suggestion  text,
  ai_comment  text,
  snippet     text,
  created_at  timestamptz not null default now()
);

-- Converge tabelas já existentes para o formato acima.
alter table issues alter column id set default gen_random_uuid();
alter table issues add column if not exists category varchar;
alter table issues add column if not exists rule_id text;
alter table issues add column if not exists description text;
alter table issues add column if not exists suggestion text;
alter table issues add column if not exists ai_comment text;
-- Trecho de código que originou o achado, para a lista exibir contexto
-- sem precisar reabrir o arquivo inteiro.
alter table issues add column if not exists snippet text;
alter table issues add column if not exists created_at timestamptz not null default now();

-- Só analysis_id, severity, file, line e title são obrigatórios. A tabela
-- original exigia também category e description; os dois são opcionais no
-- modelo novo (nem toda regra tem categoria, nem todo achado tem descrição).
alter table issues alter column category drop not null;
alter table issues alter column description drop not null;
alter table issues alter column suggestion drop not null;
alter table issues alter column file drop not null;
alter table issues alter column severity drop not null;
alter table issues alter column line drop not null;
alter table issues alter column title drop not null;

alter table issues alter column severity drop default;
alter table issues alter column severity set default 'info';

alter table issues drop constraint if exists issues_severity_check;
alter table issues
  add constraint issues_severity_check
  check (severity in ('critical', 'high', 'medium', 'low', 'info'));

create index if not exists idx_issues_analysis on issues (analysis_id);
create index if not exists idx_issues_file on issues (analysis_id, file);
create index if not exists idx_issues_severity on issues (analysis_id, severity);
create index if not exists idx_issues_category on issues (analysis_id, category);

-- A tabela code_findings foi criada numa versão anterior deste arquivo e
-- nunca recebeu dados. code_findings e issues ficaram duplicadas; a
-- issues é a que fica.
drop table if exists code_findings;

-- ---------------------------------------------------------------------------
-- models — catálogo (Fase 1)
-- ---------------------------------------------------------------------------
create table if not exists models (
  id          text primary key,
  label       text not null,
  provider    text not null,
  context_len integer not null,
  description text,
  active      boolean not null default true,
  sort_order  integer not null default 100
);
