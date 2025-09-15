#!/bin/bash
# Build and deploy script for GitHub Pages
echo "📦 Building Feed Me AI for production..."
npm run build

echo "✅ Build complete! Files ready in dist/ directory"
echo "📋 Next steps:"
echo "   1. Commit your changes: git add . && git commit -m 'Deploy updates'"
echo "   2. Push to main branch: git push origin main"
echo "   3. GitHub Actions will automatically deploy to feedmeai.victorsaly.com"