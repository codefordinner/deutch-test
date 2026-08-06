#!/bin/sh
set -e

mkdir -p /app/data

echo "=== Generating Prisma Client ==="
npx prisma generate

echo "=== Running Prisma DB Push ==="
npx prisma db push --accept-data-loss

echo "=== Running JSON Migration (if db.json exists) ==="
node migrate-json.js

echo "=== Starting Node Application ==="
exec "$@"