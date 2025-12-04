#!/bin/bash

# Sync Core Modules to Web Directory
# This script copies the compiled dist files to the web/lib/pie-core directory
# Run this after building the core modules: npm run build

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_ROOT/dist"
WEB_CORE_DIR="$PROJECT_ROOT/web/lib/pie-core"

echo "📦 Syncing core modules to web directory..."
echo "   Source: $DIST_DIR"
echo "   Target: $WEB_CORE_DIR"

# Remove old core modules
if [ -d "$WEB_CORE_DIR" ]; then
  echo "🗑️  Removing old core modules..."
  rm -rf "$WEB_CORE_DIR"
fi

# Create target directory
mkdir -p "$WEB_CORE_DIR"

# Copy dist files
if [ -d "$DIST_DIR" ]; then
  echo "📋 Copying compiled modules..."
  cp -R "$DIST_DIR"/* "$WEB_CORE_DIR/"
  echo "✅ Core modules synced successfully!"
else
  echo "❌ Error: dist directory not found at $DIST_DIR"
  echo "   Please run 'npm run build' first"
  exit 1
fi

