const fs = require('fs');
const path = 'src/locales/en-US.po';
fs.mkdirSync('src/locales', { recursive: true });
fs.closeSync(fs.openSync(path, 'a'));