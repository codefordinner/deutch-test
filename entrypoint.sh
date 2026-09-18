#!/bin/sh
set -e

mkdir -p /app/data

echo "=== Generating Prisma Client ==="
npx prisma generate

echo "=== Checking Database Status ==="
DB_FILE="/app/prisma/dev.db"
if [ -n "$DATABASE_URL" ]; then
  CLEAN_URL=$(echo "$DATABASE_URL" | sed 's/^file://')
  if [ -n "$CLEAN_URL" ]; then
    DB_FILE="$CLEAN_URL"
  fi
fi

if [ ! -f "$DB_FILE" ]; then
  echo "=== DB file not found ($DB_FILE), initializing schema ==="
  npx prisma db push --accept-data-loss
  echo "=== Running JSON Migration (if db.json exists) ==="
  node migrate-json.js
else
  echo "=== DB file exists, skipping schema push to protect data ==="
fi

echo "=== Starting Node Application ==="
exec "$@"