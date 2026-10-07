FROM haskell:9.4-slim AS builder

WORKDIR /app

COPY analyzer.cabal ./
COPY stack.yaml ./

RUN cabal update && \
    cabal build --only-dependencies -j4

COPY app ./app
COPY src ./src

RUN cabal build -j4 && \
    cp $(cabal list-bin codepilot-analyzer) /app/codepilot-analyzer

FROM debian:bookworm-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libgmp10 \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/codepilot-analyzer /app/codepilot-analyzer

EXPOSE 8001

CMD ["/app/codepilot-analyzer"]