#!/usr/bin/env node

/**
 * Generate favicon PNG files from SVG using Canvas
 * This script creates proper favicon PNGs with the FeedmeAI design
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the SVG content
const svgPath = path.join(__dirname, '../public/favicon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Create HTML file to generate favicons using Canvas
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Favicon Generator</title>
    <style>
        canvas { margin: 10px; border: 1px solid #ccc; }
        body { padding: 20px; font-family: Arial, sans-serif; }
    </style>
</head>
<body>
    <h2>FeedmeAI Favicon Generator</h2>
    <div id="canvases"></div>
    <div id="downloads"></div>

    <script>
        const svgContent = \`${svgContent}\`;
        
        // Create canvases for different sizes
        const sizes = [
            { name: 'favicon-16x16.png', size: 16 },
            { name: 'favicon-32x32.png', size: 32 },
            { name: 'apple-touch-icon.png', size: 180 },
            { name: 'favicon.ico', size: 32 }
        ];
        
        function createFavicon(name, size) {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = size;
                canvas.height = size;
                
                // Create SVG data URL
                const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
                const svgUrl = URL.createObjectURL(svgBlob);
                
                const img = new Image();
                img.onload = function() {
                    ctx.drawImage(img, 0, 0, size, size);
                    
                    // Add to page for visual verification
                    const container = document.getElementById('canvases');
                    const div = document.createElement('div');
                    div.innerHTML = \`<h4>\${name} (\${size}x\${size})</h4>\`;
                    div.appendChild(canvas);
                    container.appendChild(div);
                    
                    // Create download link
                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.download = name;
                        link.href = url;
                        link.textContent = \`Download \${name}\`;
                        link.style.display = 'block';
                        link.style.margin = '5px 0';
                        document.getElementById('downloads').appendChild(link);
                        resolve(url);
                    }, name.endsWith('.ico') ? 'image/x-icon' : 'image/png');
                };
                img.src = svgUrl;
            });
        }
        
        // Generate all favicon sizes
        async function generateFavicons() {
            console.log('Generating favicons...');
            for (const config of sizes) {
                await createFavicon(config.name, config.size);
            }
            console.log('All favicons generated! Right-click and save each image to /public/ directory');
        }
        
        generateFavicons();
    </script>
</body>
</html>
`;

// Write the HTML file
const outputPath = path.join(__dirname, '../public/favicon-generator.html');
fs.writeFileSync(outputPath, htmlContent);

console.log('✅ Favicon generator created at: public/favicon-generator.html');
console.log('📋 Instructions:');
console.log('1. Open public/favicon-generator.html in your browser');
console.log('2. Download each generated favicon PNG file');
console.log('3. Replace the placeholder PNG files in public/ directory');
console.log('4. Delete the favicon-generator.html file when done');