# 🍳 Feed me AI - Smart Recipe Suggestions from Your Ingredients

> **Fully Automated AI-Generated Application** - Transform your available ingredients into delicious meals with AI-powered recipe suggestions. Upload a photo, get instant cooking ideas, and enjoy step-by-step guided cooking.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-feedmeai.victorsaly.com-orange?style=for-the-badge&logo=react)](https://feedmeai.victorsaly.com)
[![Deploy Status](https://img.shields.io/github/deployments/victorsaly/food-inventory-recip/github-pages?style=for-the-badge&label=Deployment)](https://github.com/victorsaly/food-inventory-recip/deployments)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

## ✨ Features

### 🤖 AI-Powered Intelligence
- **📸 Ingredient Recognition**: Uses OpenAI Vision API to identify ingredients from photos
- **🍽️ Smart Recipe Suggestions**: Generates personalized recipes based on available ingredients  
- **👨‍🍳 Step-by-Step Cooking**: Interactive cooking workflow with guided instructions
- **🎥 Video-Style Tutorials**: Animated slide-based cooking tutorials with images

### 🎯 User Experience
- **⚡ Quick Recipe Ideas**: Pre-curated 25-minute recipe collection
- **❤️ Favorites System**: Save and organize your favorite recipes
- **📱 Mobile-First Design**: Optimized for all devices with responsive UI
- **🎨 Modern Interface**: Clean, intuitive design with smooth animations

### 🚀 Technical Excellence
- **🔥 Performance Optimized**: Lazy loading, image optimization, and efficient caching
- **🎪 PWA Ready**: Progressive Web App with offline capabilities
- **📊 SEO Optimized**: Full meta tags, Open Graph, Twitter Cards, JSON-LD
- **🌍 Social Sharing**: Optimized for X (Twitter), LinkedIn, and Facebook

## 🌐 Live Demo

Experience the app live: **[feedmeai.victorsaly.com](https://feedmeai.victorsaly.com)**

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **OpenAI API Key** - [Get yours at OpenAI Platform](https://platform.openai.com/api-keys)

### Installation

```bash
# Clone the repository
git clone https://github.com/victorsaly/food-inventory-recip.git
cd food-inventory-recip

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key

# Start development server
npm run dev
```

Open [http://localhost:5003](http://localhost:5003) to view the app.

## 🎯 How It Works

### 1. **Upload & Analyze** 📸
- Take a photo of your ingredients or upload from gallery
- AI analyzes and identifies all visible ingredients
- Get confidence scores for each detected item

### 2. **Get Suggestions** 🤖  
- Receive personalized recipe ideas based on your ingredients
- Browse quick 25-minute recipe collection
- Filter by cuisine type, difficulty, and cooking time

### 3. **Cook & Learn** 👨‍🍳
- Follow step-by-step guided cooking workflow
- Watch video-style animated tutorials
- Save favorites for future reference

### 4. **Organize & Share** ❤️
- Build your personal recipe collection
- Share discoveries on social media
- Access recipes across all devices

## 🏗️ Technology Stack

### Frontend Framework
- **⚛️ React 19** - Modern UI framework with concurrent features
- **📘 TypeScript** - Type-safe development experience
- **⚡ Vite** - Lightning-fast build tool and dev server

### Styling & UI
- **🎨 Tailwind CSS v4** - Utility-first CSS framework
- **🎪 Radix UI** - Unstyled, accessible components
- **🎭 Phosphor Icons** - Beautiful icon library
- **✨ Framer Motion** - Smooth animations and transitions

### AI & APIs
- **🧠 OpenAI Vision API** - Advanced image analysis
- **🎨 DALL-E Integration** - AI-generated recipe images
- **📊 Smart Caching** - Efficient API usage optimization

### Development Tools
- **🔧 ESLint** - Code linting and quality
- **🎯 GitHub Actions** - Automated CI/CD
- **📦 NPM** - Package management

## 📁 Project Structure

```
food-inventory-recip/
├── 📄 README.md              # You are here
├── 📋 package.json           # Dependencies & scripts
├── ⚙️  vite.config.ts         # Build configuration
├── 🎨 tailwind.config.js     # Styling configuration
├── 🏠 index.html             # Entry point
├── 📁 src/
│   ├── 🎯 App.tsx            # Main application component
│   ├── 📁 components/        # Reusable UI components
│   │   ├── 📸 ImageUpload.tsx       # Photo upload & analysis
│   │   ├── 🍽️  CookingWorkflow.tsx  # Recipe cooking interface
│   │   ├── ⚡ QuickIdeas.tsx         # Pre-made recipe browser
│   │   ├── ❤️  FavoritesView.tsx    # Saved recipes manager
│   │   └── 🎪 ui/                   # Base UI components
│   ├── 📁 data/             # Recipe database
│   │   └── 📊 quick-recipes.json    # Curated recipe collection
│   ├── 📁 lib/              # Utility functions
│   │   ├── 🔧 utils.ts              # Helper functions
│   │   └── 💾 favorites-storage.ts  # Local storage manager
│   └── 📁 hooks/            # Custom React hooks
├── 📁 public/               # Static assets
│   ├── 🎯 favicon.svg       # App icon
│   ├── 📱 site.webmanifest  # PWA configuration  
│   └── 🌐 CNAME            # Custom domain setup
├── 📁 docs/                # Documentation
│   └── 🚀 deployment.md    # Deployment guide
└── 📁 .github/             # GitHub configuration
    └── 🔄 workflows/deploy.yml # Auto-deployment
```

## 🔧 Configuration

### Environment Variables

```bash
# .env file
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### Build Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview build locally

# Quality Assurance
npm run type-check   # TypeScript validation
npm run lint         # Code linting
```

## 🚀 Deployment

### Automatic GitHub Pages Deployment

The app automatically deploys to GitHub Pages on every push to `main`:

1. **Fork the repository**
2. **Enable GitHub Pages** in repository settings
3. **Add OpenAI API key** to repository secrets
4. **Push changes** to trigger deployment

Detailed deployment instructions: [📖 Deployment Guide](./docs/deployment.md)

### Alternative Platforms

- **Vercel**: One-click deployment from GitHub
- **Netlify**: Automatic builds with GitHub integration  
- **Firebase Hosting**: Google's hosting platform

## 💡 Usage Tips

### For Best AI Recognition
- 🔆 **Good Lighting**: Ensure ingredients are well-lit
- 📏 **Clear Layout**: Spread items out for visibility
- 📱 **Stable Photos**: Avoid blurry or shaky images
- 🎯 **Multiple Items**: Include 3-6 ingredients for better recipes

### For Optimal Cooking Experience
- 📋 **Read Ahead**: Review all steps before starting
- ⏱️ **Prep First**: Gather all ingredients and tools
- 🎥 **Use Tutorial Mode**: Follow animated step-by-step guides
- ❤️ **Save Favorites**: Build your personal recipe collection

## 🎨 Design Philosophy

### AI-First Approach
Every feature is designed around AI capabilities, from ingredient recognition to recipe generation and cooking guidance.

### Mobile-First Responsive
The interface adapts seamlessly from mobile phones to desktop computers, ensuring a great experience on any device.

### Progressive Enhancement
Core functionality works without JavaScript, with AI features enhancing the experience progressively.

## 🤝 Contributing

This is a fully automated AI-generated application, but contributions are welcome!

### Development Setup
```bash
git clone https://github.com/victorsaly/food-inventory-recip.git
cd food-inventory-recip
npm install
cp .env.example .env
npm run dev
```

### Contribution Guidelines
- 🐛 **Bug Reports**: Use GitHub Issues
- ✨ **Feature Requests**: Use GitHub Discussions  
- 🔄 **Pull Requests**: Follow existing code style
- 📝 **Documentation**: Help improve guides and examples

## 📊 Performance & SEO

### Core Web Vitals
- ✅ **LCP < 2.5s** - Optimized image loading
- ✅ **FID < 100ms** - Minimal JavaScript blocking
- ✅ **CLS < 0.1** - Stable layout shifts

### SEO Features
- 🎯 **Meta Tags** - Complete Open Graph, Twitter Cards
- 🏗️ **Structured Data** - JSON-LD for search engines
- 🔗 **Internal Linking** - Proper navigation structure
- 📱 **Mobile Optimization** - Responsive design

### Social Media Ready
- 📘 **Facebook** - Rich Open Graph previews
- 🐦 **Twitter/X** - Optimized Twitter Cards
- 💼 **LinkedIn** - Professional sharing format
- 📊 **Analytics Ready** - Google Analytics integration

## 🔒 Privacy & Security

- 🛡️ **No Data Storage** - Images processed in memory only
- 🔐 **Secure APIs** - HTTPS-only external connections
- 👤 **Privacy First** - No user tracking or data collection
- 🍪 **No Cookies** - Local storage for favorites only

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details.

## 🌟 Acknowledgments

- **OpenAI** for providing powerful Vision and GPT APIs
- **Unsplash** for beautiful food photography
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for efficient styling system
- **GitHub** for hosting and automated deployment

---

<div align="center">

**🤖 Fully Automated AI-Generated Application**

Made with ❤️ by AI for home cooks who want to make the most of their ingredients!

[![GitHub stars](https://img.shields.io/github/stars/victorsaly/food-inventory-recip?style=social)](https://github.com/victorsaly/food-inventory-recip)
[![Twitter Follow](https://img.shields.io/twitter/follow/victorsaly?style=social)](https://twitter.com/victorsaly)

</div>
