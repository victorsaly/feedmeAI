#!/bin/bash
# Complete deployment guide script
echo "🚀 FeedmeAI - GitHub Pages Deployment Setup Guide"
echo "========================================"
echo ""

echo "1. 🔑 Give the worker its keys (the page needs none)"
echo "   cd worker && npx wrangler secret put OPENAI_API_KEY && npx wrangler deploy"
echo "   (see worker/wrangler.toml for the optional ones)"
echo ""

echo "2. 🔧 Enable GitHub Pages"
echo "   - Go to Settings → Pages"
echo "   - Source: Deploy from a branch → GitHub Actions"
echo "   - This will use the .github/workflows/deploy.yml workflow"
echo ""

echo "3. 🏗️ Test Local Build (optional)"
echo "   Running build test..."
npm run build
if [ $? -eq 0 ]; then
    echo "   ✅ Local build successful!"
else
    echo "   ❌ Local build failed. Fix errors before deploying."
    exit 1
fi
echo ""

echo "4. 🚀 Deploy to GitHub Pages"
echo "   Your deployment workflow includes:"
echo "   - ✅ Node.js 20 setup"
echo "   - ✅ Dependency installation"
echo "   - ✅ TypeScript validation"
echo "   - ✅ Production build with OpenAI API key"
echo "   - ✅ Automatic GitHub Pages deployment"
echo ""

echo "5. 🌐 Access Your Deployed App"
echo "   After pushing to main branch:"
echo "   - Check Actions tab for deployment progress"
echo "   - App will be available at: https://yourusername.github.io/food-inventory-recip/"
echo "   - With custom domain: https://feedmeai.victorsaly.com"
echo ""

echo "🎯 Ready to deploy! Just push to main branch to trigger deployment."
echo "📖 Full documentation: ./docs/deployment.md"