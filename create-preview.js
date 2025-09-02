const fs = require('fs');
const path = require('path');

// Simple HTML to create the preview image
const html = `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            padding: 0;
            width: 1200px;
            height: 630px;
            background: #2A2A2A;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        }
        .logo-container {
            display: flex;
            align-items: center;
            gap: 40px;
        }
        .logo-text {
            font-size: 140px;
            font-weight: bold;
            color: #F7911A;
            letter-spacing: -2px;
        }
    </style>
</head>
<body>
    <div class="logo-container">
        <svg width="120" height="120" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.428 7.05251C0.5075 7.97301 0 9.19801 0 10.5C0 16.289 4.711 21 10.5 21C14.3115 21 17.6575 18.956 19.4985 15.9075C18.5185 16.52 17.3635 16.8735 16.128 16.8735C12.614 16.8735 9.7545 14.014 9.7545 10.5C9.7545 7.63001 7.749 5.62451 4.879 5.62451C3.577 5.62451 2.352 6.13201 1.4315 7.05251H1.428Z" fill="#FFCF24"/>
            <path d="M20.9997 10.5C20.9997 4.711 16.2887 0 10.4997 0C7.69622 0 5.05722 1.092 3.07622 3.0765C2.46022 3.6925 1.92822 4.3715 1.49072 5.0995C2.47072 4.4835 3.63272 4.1265 4.87522 4.1265C8.38922 4.1265 11.2487 6.986 11.2487 10.5C11.2487 13.37 13.2542 15.3755 16.1242 15.3755C18.8122 15.3755 20.9997 13.188 20.9997 10.5Z" fill="#F7911A"/>
        </svg>
        <div class="logo-text">Juice Swap</div>
    </div>
</body>
</html>`;

// Write the HTML file
const outputPath = path.join(__dirname, 'apps/web/public/images/juiceswap-preview.html');
fs.writeFileSync(outputPath, html);

console.log('HTML preview created at:', outputPath);
console.log('');
console.log('To convert to PNG, you can:');
console.log('1. Open the HTML file in a browser and take a screenshot');
console.log('2. Use an online HTML-to-PNG converter');
console.log('3. Use a tool like wkhtmltopdf/wkhtmltoimage if installed');
console.log('');
console.log('Then replace apps/web/public/images/1200x630_Rich_Link_Preview_Image.png');