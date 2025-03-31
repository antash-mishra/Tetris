FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# Builder stage - compiles the Rust binary efficiently
FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release --bin server

# Runtime stage
FROM debian:bookworm-slim AS runtime
WORKDIR /app

# Install SQLite shared library
RUN apt-get update && apt-get install -y libsqlite3-0 && rm -rf /var/lib/apt/lists/*

# Copy compiled binary (only once)
COPY --from=builder /app/target/release/server /usr/local/bin/server

# Ensure SQLite database is available
# Changed from score.dbn to score.db to match what's in your Dockerfile
COPY data/score.db /app/data/score.db

EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/server"]
