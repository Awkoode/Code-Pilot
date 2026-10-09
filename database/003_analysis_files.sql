-- CodePilot — 003_analysis_files
--
-- Armazena o conteúdo dos arquivos que tiveram achados, para que a página de
-- análise de código consiga renderizar as linhas sem baixar o repositório de
-- novo a cada visita.
--
-- Decisão de escopo: guardamos apenas arquivos COM achado. Num repositório
-- típico isso é uma fração pequena dos arquivos (medido: 11 de 170 no
-- pallets/click), então o custo de armazenamento fica bajo e a página
-- responde instantaneamente.

create table if not exists analysis_files (
  analysis_id uuid not null references analyses (id) on delete cascade,
  file_path   text not null,
  content     text not null,
  lines_count integer not null default 0,
  created_at  timestamptz not null default now(),
  primary key (analysis_id, file_path)
);

create index if not exists idx_analysis_files_path on analysis_files (analysis_id, file_path);

-- Tabela de controle da Fase 3 na análise.
-- Uma coluna por statement: "add column if not exists a, add column b" não
-- é sintaxe válida no Postgres.
alter table analyses add column if not exists files_stored integer not null default 0;
alter table analyses add column if not exists explained_at timestamptz;