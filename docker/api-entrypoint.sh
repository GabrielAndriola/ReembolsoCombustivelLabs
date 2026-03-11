#!/bin/sh
set -eu

echo "Generating Prisma client..."
npm run db:generate

if [ "${PRISMA_DB_PUSH:-false}" = "true" ]; then
  echo "Synchronizing database schema..."
  npm run db:push
fi

echo "Starting API..."
exec npm run start:api
