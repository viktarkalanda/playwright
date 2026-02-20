const fs = require('fs');
const path = require('path');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);

// ANSI colors for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

// Minimum required characters
const MIN_CHARS = 300;

// Track totals
let totalChars = 0;
let totalLines = 0;
let totalFiles = 0;

async function countChars(file) {
    try {
        const content = await readFile(file, 'utf8');
        const chars = content.length;
        const lines = content.split('\n').length;
        console.log(`${colors.green}${file}:${colors.reset}`);
        console.log(`  Characters: ${chars}`);
        console.log(`  Lines: ${lines}\n`);
        totalChars += chars;
        totalLines += lines;
        totalFiles++;
        return { chars, lines };
    } catch (error) {
        console.error(`${colors.red}Error reading ${file}: ${error.message}${colors.reset}`);
        return { chars: 0, lines: 0 };
    }
}

async function processDirectory(dir, pattern) {
    try {
        const files = await readdir(dir);
        const tsFiles = files.filter(file => file.endsWith('.ts'));
        console.log(`${colors.blue}${pattern}:${colors.reset}`);
        for (const file of tsFiles) {
            await countChars(path.join(dir, file));
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`${colors.red}Error reading directory ${dir}: ${error.message}${colors.reset}`);
        }
    }
}

async function checkMinLength(file) {
    try {
        const content = await readFile(file, 'utf8');
        const chars = content.length;
        if (chars < MIN_CHARS) {
            console.log(`${colors.red}Warning: ${file} has less than ${MIN_CHARS} characters (${chars})${colors.reset}`);
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`${colors.red}Error checking ${file}: ${error.message}${colors.reset}`);
        }
    }
}

async function main() {
    console.log(`${colors.blue}Counting characters in test files...${colors.reset}\n`);

    // Process different directories
    await processDirectory('tests/api', 'API Tests');
    await processDirectory('tests/api/smoke', 'API Smoke Tests');
    await processDirectory('tests/ui', 'UI Tests');
    await processDirectory('src/helpers', 'Helper Files');
    await processDirectory('src/pageObjects', 'Page Objects');

    // Print totals
    console.log(`${colors.yellow}Total Statistics:${colors.reset}`);
    console.log(`Total Files: ${totalFiles}`);
    console.log(`Total Characters: ${totalChars}`);
    console.log(`Total Lines: ${totalLines}`);
    console.log(`Average Characters per File: ${Math.round(totalChars / totalFiles)}`);
    console.log(`Average Lines per File: ${Math.round(totalLines / totalFiles)}\n`);

    // Check minimum requirements
    console.log(`${colors.blue}Checking minimum requirements...${colors.reset}`);
    const directories = ['tests/api', 'tests/api/smoke', 'tests/ui', 'src/helpers', 'src/pageObjects'];
    for (const dir of directories) {
        try {
            const files = await readdir(dir);
            const tsFiles = files.filter(file => file.endsWith('.ts'));
            for (const file of tsFiles) {
                await checkMinLength(path.join(dir, file));
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`${colors.red}Error processing directory ${dir}: ${error.message}${colors.reset}`);
            }
        }
    }
}

main().catch(error => {
    console.error(`${colors.red}Script error: ${error.message}${colors.reset}`);
    process.exit(1);
}); 
