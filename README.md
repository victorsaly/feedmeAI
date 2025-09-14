# 🍳 Feed me - AI Recipe Suggestions

**Feed me** is a simple, AI-powered app that analyzes photos of your ingredients and suggests delicious recipes you can make with them.

## ✨ Features

- 📸 **Photo Upload**: Take a photo or upload an image of your ingredients
- 🤖 **AI Analysis**: Uses OpenAI's Vision API to identify ingredients in your photos
- 🍽️ **Recipe Suggestions**: Get personalized recipe ideas based on what you have
- 📱 **Mobile-First**: Optimized for mobile devices with responsive design
- ⚡ **Fast & Simple**: Clean, distraction-free interface focused on one task

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v18 or higher)
2. **OpenAI API Key** - Get yours at [OpenAI Platform](https://platform.openai.com/api-keys)

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your OpenAI API key:
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5001](http://localhost:5001) in your browser

## 🛠️ How It Works

1. **Upload a Photo**: Take a picture of your fridge, pantry, or ingredients
2. **AI Analysis**: The app uses OpenAI's vision model to identify visible ingredients
3. **Get Recipes**: Receive personalized recipe suggestions based on what you have
4. **Cook & Enjoy**: Follow the step-by-step instructions to create delicious meals

## 💡 Tips for Best Results

- **Good Lighting**: Ensure your ingredients are well-lit and clearly visible
- **Multiple Items**: Include several ingredients in one photo for better recipe variety  
- **Clear Photos**: Avoid blurry or dark images for more accurate identification
- **Organize Items**: Spread ingredients out so they're all visible

## 🔧 Configuration

The app uses environment variables for configuration:

- `VITE_OPENAI_API_KEY`: Your OpenAI API key for ingredient analysis

## 🏗️ Built With

- **React 19** - UI framework
- **TypeScript** - Type-safe development  
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **OpenAI Vision API** - Image analysis
- **Phosphor Icons** - Icon library
- **Radix UI** - Accessible components

## 📄 License

MIT License - see LICENSE file for details.

---

**Made with ❤️ for home cooks who want to make the most of their ingredients!**
