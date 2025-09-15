# 🍳 Feed Me AI

Transform your ingredients into delicious meals with AI-powered recipe suggestions. Upload a photo, get instant cooking ideas, and enjoy step-by-step guided cooking.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-feedmeai.victorsaly.com-orange?style=for-the-badge&logo=react)](https://feedmeai.victorsaly.com)

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+)
- **OpenAI API Key** - [Get yours here](https://platform.openai.com/api-keys)

### Setup
```bash
# Quick setup with our script
./scripts/setup.sh

# Or manually:
git clone https://github.com/victorsaly/food-inventory-recip.git
cd food-inventory-recip
npm install
cp .env.example .env
# Add your OpenAI API key to .env
```

### Development
```bash
# Start dev server
./scripts/dev.sh
# Or: npm run dev

# Build for production  
./scripts/deploy.sh
# Or: npm run build
```

## ✨ What It Does

**📸 Smart Recognition** - AI identifies ingredients from photos  
**🍽️ Recipe Generation** - Creates personalized recipes from your ingredients  
**👨‍🍳 Guided Cooking** - Step-by-step tutorials with animations  
**⚡ Quick Ideas** - Browse 25-minute recipe collection  
**❤️ Favorites** - Save and organize your favorite recipes  

## � Built With

**React 19** • **TypeScript** • **Vite** • **Tailwind CSS** • **OpenAI APIs**

##  Project Structure

```
├── src/
│   ├── App.tsx              # Main application
│   ├── components/          # UI components
│   │   ├── ImageUpload.tsx      # Photo upload & AI analysis  
│   │   ├── CookingWorkflow.tsx  # Step-by-step cooking
│   │   ├── QuickIdeas.tsx       # Recipe browser
│   │   └── FavoritesView.tsx    # Saved recipes
│   ├── data/
│   │   └── quick-recipes.json   # Recipe database
│   └── lib/                 # Utilities & storage
├── docs/                    # Documentation
│   ├── PRD.md              # Product requirements  
│   ├── SECURITY.md         # Security guidelines
│   └── deployment.md       # Deployment guide
└── scripts/                # Utility scripts
    ├── setup.sh            # Project setup
    ├── dev.sh              # Start development  
    └── deploy.sh           # Build & deploy
```

## 📖 Documentation

- **[Product Requirements](./docs/PRD.md)** - Full feature specifications
- **[Deployment Guide](./docs/deployment.md)** - How to deploy to production
- **[Security Guidelines](./docs/SECURITY.md)** - Security best practices

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.
