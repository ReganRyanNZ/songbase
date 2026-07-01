#!/usr/bin/env bash
# Dev entrypoint for songbase. Runs inside the container as uid 1000.
set -euo pipefail

cd /app

# 1) Gems — cached in /app/vendor/bundle (on the bind mount), so this is a
#    fast no-op on restart unless the Gemfile/Gemfile.lock changed.
echo "[songbase] checking gems..."
if ! bundle check >/dev/null 2>&1; then
  echo "[songbase] installing gems..."
  bundle install
fi

# 2) A previous ungraceful stop leaves a stale pidfile; puma then refuses to
#    boot ("A server is already running"). Always clear it.
rm -f /app/tmp/pids/server.pid

# 3) Apply pending migrations for the development DB (fast no-op when
#    current). We use db:migrate, NOT db:prepare: prepare also tries to
#    create the *test* DB, which fails on this host's SQL_ASCII template1.
#    Keep going on error so the container stays up if the DB is briefly down.
echo "[songbase] migrating database..."
bundle exec rails db:migrate || echo "[songbase] WARNING: db:migrate failed, continuing"

echo "[songbase] starting puma..."
exec "$@"
