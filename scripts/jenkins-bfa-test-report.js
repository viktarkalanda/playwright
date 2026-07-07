const fs = require('fs');
const path = require('path');

const JUNIT_PATH = path.join(process.cwd(), 'test-results/jenkins-showcase/junit.xml');
const REPORT_DIR = path.join(process.cwd(), 'test-results/jenkins-showcase');
const REPORT_TXT = path.join(REPORT_DIR, 'bfa-per-test-report.txt');
const REPORT_HTML = path.join(REPORT_DIR, 'bfa-per-test-report.html');

// Keep in sync with Jenkins -> Failure Cause Management rules.
const BFA_RULES = [
  {
    name: 'Demo intentional failure',
    pattern: /Intentional failure to verify Jenkins Claim and BFA plugins/,
  },
  {
    name: 'Playwright timeout',
    pattern: /Timeout .* exceeded/,
  },
  {
    name: 'Application unavailable',
    pattern: /ECONNREFUSED/,
  },
  {
    name: 'Flaky retry detected',
    pattern: /Retry #\d+/,
  },
  {
    name: 'Assertion mismatch',
    pattern: /expect\(.*\)\.toBe/,
  },
];

function decodeXml(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseFailedTests(xml) {
  const blocks = xml.match(/<testcase[\s\S]*?<\/testcase>/g) || [];

  return blocks
    .map((block) => {
      const name = decodeXml(block.match(/name="([^"]*)"/)?.[1] ?? 'unknown');
      if (!block.includes('<failure')) {
        return null;
      }

      const failureBody = decodeXml(
        block.match(/<failure[\s\S]*?<!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ??
          block.match(/<failure[^>]*>([\s\S]*?)<\/failure>/)?.[1] ??
          '',
      );

      return { name, failureBody };
    })
    .filter(Boolean);
}

function shortTestName(fullName) {
  const parts = fullName.split(' › ');
  return parts.length > 1 ? parts[parts.length - 1] : fullName;
}

function matchBfaRule(failureBody) {
  for (const rule of BFA_RULES) {
    if (rule.pattern.test(failureBody)) {
      return rule.name;
    }
  }
  return null;
}

function buildRows(failedTests) {
  return failedTests.map((test) => {
    const matchedRule = matchBfaRule(test.failureBody);
    return {
      testName: shortTestName(test.name),
      fullName: test.name,
      matchedRule,
      action: matchedRule
        ? 'Known BFA issue — check Identified problems on build page'
        : 'No BFA rule — investigate manually',
      status: matchedRule ? 'MATCH' : 'NO_RULE',
    };
  });
}

function buildTextReport(rows) {
  const matched = rows.filter((row) => row.status === 'MATCH');
  const unmatched = rows.filter((row) => row.status === 'NO_RULE');

  const lines = [
    '================================================================',
    'BFA PER-TEST REPORT',
    '================================================================',
    '',
    `FAILED WITH BFA RULE (${matched.length})`,
    ...matched.map(
      (row) => `  [MATCH]    ${row.testName}\n             -> ${row.matchedRule}`,
    ),
    '',
    `FAILED WITHOUT BFA RULE (${unmatched.length})`,
    ...unmatched.map((row) => `  [NO RULE]  ${row.testName}\n             -> investigate manually`),
    '',
    'Note: BFA itself works on build console log, not per test.',
    'This report maps each failed test message to the same BFA rules.',
    '================================================================',
  ];

  return lines.join('\n');
}

function buildHtmlReport(rows) {
  const rowsHtml = rows
    .map((row) => {
      const cssClass = row.status === 'MATCH' ? 'match' : 'no-rule';
      const rule = row.matchedRule ?? '—';
      return `
        <tr class="${cssClass}">
          <td>${escapeHtml(row.testName)}</td>
          <td>${escapeHtml(rule)}</td>
          <td>${escapeHtml(row.action)}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>BFA Per-Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; }
    h1 { font-size: 20px; }
    table { border-collapse: collapse; width: 100%; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    tr.match { background: #eefaf0; }
    tr.no-rule { background: #fff3f3; }
    .legend { margin-top: 16px; }
    .legend span { display: inline-block; margin-right: 16px; padding: 4px 8px; }
    .legend .match { background: #eefaf0; border: 1px solid #cde8d1; }
    .legend .no-rule { background: #fff3f3; border: 1px solid #f0caca; }
  </style>
</head>
<body>
  <h1>BFA Per-Test Report</h1>
  <p>Each failed test is mapped to a BFA Failure Cause rule when the test error message matches.</p>
  <div class="legend">
    <span class="match">MATCH = known BFA issue</span>
    <span class="no-rule">NO RULE = investigate manually</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Test</th>
        <th>BFA rule</th>
        <th>What to do</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function main() {
  if (!fs.existsSync(JUNIT_PATH)) {
    console.log('BFA per-test report skipped: junit.xml not found.');
    process.exit(0);
  }

  const xml = fs.readFileSync(JUNIT_PATH, 'utf8');
  const rows = buildRows(parseFailedTests(xml));
  const textReport = buildTextReport(rows);
  const htmlReport = buildHtmlReport(rows);

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_TXT, textReport, 'utf8');
  fs.writeFileSync(REPORT_HTML, htmlReport, 'utf8');

  console.log(`\n${textReport}\n`);
  console.log(`HTML report: ${REPORT_HTML}`);
}

main();
