#!/bin/bash
# Create proper favicon PNG files using ImageMagick (if available)

echo "🎨 Creating FeedMe AI favicon PNG files..."

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "✅ ImageMagick found, converting SVG to PNG..."
    
    # Convert SVG to different PNG sizes
    convert -background transparent public/favicon.svg -resize 16x16 public/favicon-16x16.png
    convert -background transparent public/favicon.svg -resize 32x32 public/favicon-32x32.png
    convert -background transparent public/favicon.svg -resize 180x180 public/apple-touch-icon.png
    convert -background transparent public/favicon.svg -resize 32x32 public/favicon.ico
    
    echo "✅ Favicon PNGs created successfully!"
    ls -la public/favicon*.png public/favicon.ico
else
    echo "❌ ImageMagick not found. Installing with Homebrew..."
    
    # Install ImageMagick via Homebrew if not available
    if command -v brew &> /dev/null; then
        brew install imagemagick
        echo "✅ ImageMagick installed! Re-running conversion..."
        
        # Convert SVG to different PNG sizes
        convert -background transparent public/favicon.svg -resize 16x16 public/favicon-16x16.png
        convert -background transparent public/favicon.svg -resize 32x32 public/favicon-32x32.png
        convert -background transparent public/favicon.svg -resize 180x180 public/apple-touch-icon.png
        convert -background transparent public/favicon.svg -resize 32x32 public/favicon.ico
        
        echo "✅ Favicon PNGs created successfully!"
        ls -la public/favicon*.png public/favicon.ico
    else
        echo "❌ Homebrew not found. Please install ImageMagick manually or use the favicon-generator.html"
        echo "📋 Alternative: Open public/favicon-generator.html in your browser"
    fi
fi

echo "🎯 Favicon creation complete!"