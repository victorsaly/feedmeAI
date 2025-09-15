#!/bin/bash
# Script to fix UI component icon imports to use correct phosphor package

echo "🔧 Fixing UI component icon imports to use @phosphor-icons/react..."

# Replace phosphor-react with @phosphor-icons/react
find src/components/ui -name "*.tsx" -type f -exec sed -i '' \
  -e 's|phosphor-react|@phosphor-icons/react|g' \
  {} \;

echo "✅ Fixed UI component icon imports to use @phosphor-icons/react"