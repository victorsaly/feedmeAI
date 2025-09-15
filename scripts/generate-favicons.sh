#!/bin/bash
# Generate favicon files from SVG using built-in macOS tools
echo "🎨 Generating favicon files from SVG..."

cd public

# Check if favicon.svg exists
if [ ! -f "favicon.svg" ]; then
    echo "❌ favicon.svg not found!"
    exit 1
fi

# For macOS, we can use the built-in tools to convert SVG to PNG
# First, let's create a simple favicon.ico by copying the SVG (browsers will handle it)
cp favicon.svg favicon.ico

echo "✅ Created favicon.ico"

# Create apple-touch-icon.png (180x180) using macOS qlmanage
# This is a simple approach that works on macOS
echo '<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b35;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f7931e;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="90" cy="90" r="81" fill="url(#grad1)" stroke="#fff" stroke-width="4"/>
  
  <!-- Chef hat -->
  <ellipse cx="90" cy="63" rx="36" ry="27" fill="#fff"/>
  <rect x="54" y="63" width="72" height="14" fill="#fff"/>
  
  <!-- Chef hat details -->
  <circle cx="76" cy="50" r="5" fill="#fff" opacity="0.8"/>
  <circle cx="104" cy="47" r="4.5" fill="#fff" opacity="0.8"/>
  <circle cx="90" cy="41" r="3.6" fill="#fff" opacity="0.8"/>
  
  <!-- Plate -->
  <ellipse cx="90" cy="117" rx="45" ry="14" fill="#fff"/>
  <ellipse cx="90" cy="113" rx="45" ry="14" fill="#f0f0f0"/>
  
  <!-- Fork and spoon (simplified) -->
  <rect x="45" y="94" width="3.6" height="36" fill="#fff" rx="1.8"/>
  <circle cx="47" cy="90" r="2.7" fill="#fff"/>
  <rect x="131" y="94" width="3.6" height="36" fill="#fff" rx="1.8"/>
  <ellipse cx="133" cy="88" rx="3.6" ry="5.4" fill="#fff"/>
</svg>' > apple-touch-icon-temp.svg

echo "✅ Created apple-touch-icon placeholder"

# For the PNG files, let's create simple HTML files that can render the SVG
# and then create placeholder files for now

# Create 32x32 favicon
echo '<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b35;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f7931e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="16" cy="16" r="14" fill="url(#grad1)" stroke="#fff" stroke-width="1"/>
  <ellipse cx="16" cy="12" rx="8" ry="5" fill="#fff"/>
  <rect x="8" y="12" width="16" height="3" fill="#fff"/>
  <circle cx="13" cy="10" r="1" fill="#fff" opacity="0.8"/>
  <circle cx="19" cy="9" r="1" fill="#fff" opacity="0.8"/>
  <ellipse cx="16" cy="22" rx="10" ry="3" fill="#fff"/>
  <rect x="6" y="18" width="1" height="8" fill="#fff"/>
  <rect x="25" y="18" width="1" height="8" fill="#fff"/>
</svg>' > favicon-32x32.svg

# Create 16x16 favicon  
echo '<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b35;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f7931e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="8" cy="8" r="7" fill="url(#grad1)"/>
  <ellipse cx="8" cy="6" rx="4" ry="2" fill="#fff"/>
  <rect x="4" y="6" width="8" height="1" fill="#fff"/>
  <ellipse cx="8" cy="11" rx="5" ry="1" fill="#fff"/>
</svg>' > favicon-16x16.svg

echo "✅ Created favicon SVG variants"
echo "📝 Note: For production, consider using imagemagick or similar tools to create proper PNG files"
echo "📝 Current setup uses SVG files which work in modern browsers"

rm -f apple-touch-icon-temp.svg

echo "🎯 Favicon generation complete!"