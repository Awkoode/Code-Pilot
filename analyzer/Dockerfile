FROM haskell:9.4-slim AS builder

WORKDIR /app

# Copia os ficheiros de configuração do projeto ajustando o nome do arquivo cabal
COPY analyzer.cabal ./
COPY stack.yaml ./

# Atualiza pacotes e compila dependências
RUN cabal update && cabal build --only-dependencies -j4

# Copia o código fonte
COPY app ./app
COPY src ./src

# Compila o executável final
RUN cabal build -j4 && \
    cp $(cabal list-bin codepilot-analyzer) /app/codepilot-analyzer

# Imagem final leve
FROM debian:bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgmp10 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/codepilot-analyzer /app/codepilot-analyzer

EXPOSE 8001

CMD ["/app/codepilot-analyzer"]