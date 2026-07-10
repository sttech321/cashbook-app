const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js') && !fullPath.includes('node_modules') && fullPath !== path.join(__dirname, 'App.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // Remove any existing fontFamily declarations (to clean up completely as requested)
      content = content.replace(/fontFamily:\s*['"][^'"]+['"],?\s*/g, '');
      
      // Replace bold font weights with Poppins-Bold
      content = content.replace(/fontWeight:\s*['"](?:600|700|800|900|bold)['"]/g, "fontFamily: 'Poppins-Bold'");
      
      // Remove other font weights completely (they will fall back to Poppins-Regular via App.js overriding)
      content = content.replace(/fontWeight:\s*['"](?:100|200|300|400|500|normal)['"],?\s*/g, '');
      
      // Fix potential trailing commas created by removals
      content = content.replace(/,\s*}/g, ' }');
      content = content.replace(/{\s*,/g, '{ ');
      content = content.replace(/,\s*,/g, ',');

      // If we replaced things, write it back
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done!');
