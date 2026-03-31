#!/bin/bash
# Sync schema files from shared package to MCP server.
# Run: npm run sync-schemas

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SHARED_SCHEMAS="$SCRIPT_DIR/../../shared/src/schemas"
MCP_SCHEMAS="$SCRIPT_DIR/../src/schemas"

mkdir -p "$MCP_SCHEMAS"

cp "$SHARED_SCHEMAS/todo.ts" "$MCP_SCHEMAS/todo.ts"
cp "$SHARED_SCHEMAS/project.ts" "$MCP_SCHEMAS/project.ts"
cp "$SHARED_SCHEMAS/sprint.ts" "$MCP_SCHEMAS/sprint.ts"

echo "Synced schemas: todo.ts, project.ts, sprint.ts → src/schemas/"
