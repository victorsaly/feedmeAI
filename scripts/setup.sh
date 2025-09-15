#!/bin/bash
# Project setup script for new developers
echo "🔧 Setting up Feed Me AI development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please add your OpenAI API key to .env file"
fi

echo "✅ Setup complete!"
echo "📋 Next steps:"
echo "   1. Add your OpenAI API key to .env file"
echo "   2. Run 'npm run dev' to start development server"