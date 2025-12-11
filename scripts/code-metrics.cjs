const fs = require('fs');
const path = require('path');

const roots = ['src', 'tests'];
const stats = roots.reduce((acc, key) => {
  acc[key] = { files: 0, lines: 0, chars: 0 };
  return acc;
}, {});

const validExtensions = new Set(['.ts', '.tsx']);

function isCountableFile(filePath) {
  const ext = path.extname(filePath);
  if (!validExtensions.has(ext)) {
    return false;
  }
  return !filePath.endsWith('.d.ts');
}

function countFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const chars = text.length;
  const lines = chars === 0 ? 0 : text.split('\n').length;
  return { chars, lines };
}

function walk(dirPath, groupKey) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, groupKey);
    } else if (entry.isFile() && isCountableFile(fullPath)) {
      const { chars, lines } = countFile(fullPath);
      stats[groupKey].files += 1;
      stats[groupKey].chars += chars;
      stats[groupKey].lines += lines;
    }
  }
}

for (const root of roots) {
  if (fs.existsSync(root)) {
    walk(root, root);
  }
}

const total = Object.values(stats).reduce(
  (acc, group) => {
    acc.files += group.files;
    acc.lines += group.lines;
    acc.chars += group.chars;
    return acc;
  },
  { files: 0, lines: 0, chars: 0 },
);

function printGroup(name, data) {
  console.log(`[${name}]`);
  console.log(`- files: ${data.files}`);
  console.log(`- lines: ${data.lines}`);
  console.log(`- characters: ${data.chars}`);
  console.log('');
}

console.log('Code metrics:\n');
for (const root of roots) {
  printGroup(root, stats[root]);
}
console.log('[total]');
console.log(`- files: ${total.files}`);
console.log(`- lines: ${total.lines}`);
console.log(`- characters: ${total.chars}`);
