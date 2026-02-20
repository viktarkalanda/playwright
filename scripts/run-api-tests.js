const { spawn } = require('child_process');

function runApiTests() {
  const child = spawn('npx', ['playwright', 'test', '--config=playwright.api.config.ts'], {
    stdio: 'inherit',
    shell: true,
  });

  child.on('close', (code) => {
    process.exit(code ?? 1);
  });

  child.on('error', () => {
    process.exit(1);
  });
}

runApiTests();
