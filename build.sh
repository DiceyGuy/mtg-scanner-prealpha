#!/bin/bash
set -e

echo "🔧 MTG Scanner Pro - Fixing permissions..."

# Give execute permissions to all bin scripts
find node_modules/.bin -type f -exec chmod +x {} \;

echo "✅ Permissions fixed, running build..."

# Run the build
npm run build

echo "🎉 Build completed successfully!"