# Deployment Guide

This document provides comprehensive instructions for deploying Feed me AI to various platforms.

## 🚀 GitHub Pages Deployment (Automated)

### Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to a GitHub repository
2. **GitHub Pages Settings**: Enable GitHub Pages in your repository settings
3. **Environment Variables**: Set up any required environment variables

### Automatic Deployment

The project is configured for automatic deployment using GitHub Actions:

1. **Push to Main**: Every push to the `main` branch automatically triggers deployment
2. **Manual Deployment**: You can also trigger deployment manually from the Actions tab

### Setup Steps

1. **Enable GitHub Pages**:
   ```
   Repository → Settings → Pages → Source: GitHub Actions
   ```

2. **Configure Environment Variables**:
   ```
   Repository → Settings → Secrets and Variables → Actions → Repository secrets
   ```
   
   Add the following secret:
   - **Name**: `VITE_OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (get one at https://platform.openai.com/api-keys)

3. **Push Your Code**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

4. **Monitor Deployment**:
   - Go to your repository's **Actions** tab
   - Watch the "Deploy to GitHub Pages" workflow run
   - Deployment typically takes 2-3 minutes
   - Green checkmark = successful deployment

5. **Access Your App**:
   Your app will be available at: `https://yourusername.github.io/food-inventory-recip/`

### Custom Domain Configuration

**Important**: When using a custom domain, the Vite configuration must be set correctly:

#### For Custom Domain (e.g., feedmeai.victorsaly.com):
```typescript
// vite.config.ts
export default defineConfig({
  base: '/',  // Root path for custom domains
  // ... rest of config
})
```

#### For GitHub Pages Subdirectory (username.github.io/repo-name):
```typescript
// vite.config.ts  
export default defineConfig({
  base: '/repository-name/',  // Subdirectory path
  // ... rest of config
})
```

The current configuration uses `base: '/'` for the custom domain `feedmeai.victorsaly.com`.

### Custom Domain Setup

To use a custom domain like `feedmeai.victorsaly.com`:

1. **Add CNAME File**:
   ```bash
   echo "feedmeai.victorsaly.com" > public/CNAME
   ```

2. **Configure DNS**:
   Add a CNAME record in your DNS settings:
   ```
   CNAME: feedmeai.victorsaly.com → yourusername.github.io
   ```

3. **Update GitHub Pages Settings**:
   - Go to Repository → Settings → Pages
   - Enter your custom domain: `feedmeai.victorsaly.com`
   - Enable "Enforce HTTPS"

### 🔧 Troubleshooting GitHub Pages Deployment

#### Deployment Fails

1. **Check GitHub Actions Log**:
   - Go to repository **Actions** tab
   - Click on the failed workflow run
   - Review build logs for specific errors

2. **Common Issues**:

   **Missing API Key Secret**:
   ```
   Error: VITE_OPENAI_API_KEY is not defined
   ```
   Solution: Add `VITE_OPENAI_API_KEY` to repository secrets

   **Build Failures**:
   ```
   Error: TypeScript errors in production build
   ```
   Solution: Fix TypeScript errors locally first:
   ```bash
   npm run type-check
   npm run build
   ```

   **Node Version Issues**:
   ```
   Error: Node version compatibility
   ```
   Solution: Workflow uses Node.js 20, ensure local development uses compatible version

#### Site Not Loading

1. **Check GitHub Pages Settings**:
   - Repository → Settings → Pages
   - Source should be: **GitHub Actions**
   - Custom domain configured correctly

2. **Clear Browser Cache**:
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Try incognito/private browsing

3. **Check DNS Propagation** (for custom domains):
   ```bash
   nslookup feedmeai.victorsaly.com
   ```

#### API Not Working

1. **Check Console Errors**:
   - Open browser dev tools → Console
   - Look for API key or CORS errors

2. **Verify Environment Variables**:
   - Ensure `VITE_OPENAI_API_KEY` secret is set
   - Check that the key has proper OpenAI permissions

## 🌐 Alternative Deployment Platforms

### Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Custom Domain**: Configure in Vercel dashboard

### Netlify

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy via CLI**:
   ```bash
   npm i -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Or use Git**: Connect your GitHub repository in Netlify dashboard

### Firebase Hosting

1. **Install Firebase CLI**:
   ```bash
   npm i -g firebase-tools
   ```

2. **Initialize Firebase**:
   ```bash
   firebase init hosting
   ```

3. **Deploy**:
   ```bash
   npm run build
   firebase deploy
   ```

## 🔧 Build Configuration

### Environment Variables

Create `.env` file for local development:
```bash
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

For production, set environment variables in your deployment platform.

### Build Scripts

Available npm scripts:
```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

### Vite Configuration

The `vite.config.ts` is configured for:
- ✅ GitHub Pages compatibility
- ✅ Automatic base path configuration
- ✅ Optimized chunking for performance
- ✅ Asset optimization

## 🎯 SEO & Social Sharing

### Included Features

- ✅ **Open Graph Tags**: Optimized for Facebook sharing
- ✅ **Twitter Cards**: Rich previews on Twitter/X
- ✅ **LinkedIn Optimization**: Professional sharing format
- ✅ **JSON-LD**: Structured data for search engines
- ✅ **PWA Support**: App-like experience on mobile
- ✅ **Favicon & Icons**: All device sizes covered

### Social Media Images

Create these images in the `public/` directory:
- `og-image.png` (1200×630px) - For Open Graph/Twitter
- `screenshot-wide.png` (1280×800px) - PWA screenshot
- `screenshot-narrow.png` (750×1334px) - Mobile screenshot

## 🔍 Monitoring & Analytics

### Adding Analytics

To add Google Analytics, add to `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Performance Monitoring

Consider adding:
- **Sentry** for error tracking
- **Lighthouse** for performance monitoring
- **Hotjar** for user behavior analysis

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Routing Issues**: Ensure proper base configuration in `vite.config.ts`

3. **API Keys**: Verify environment variables are set correctly

4. **CORS Issues**: Check API endpoints and CORS configuration

### Support

- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check this docs folder for updates

---

Last updated: $(date)
Generated by: Feed me AI deployment system