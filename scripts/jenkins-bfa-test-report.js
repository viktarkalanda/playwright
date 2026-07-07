const fs = require('fs');
const path = require('path');

const JUNIT_PATH = path.join(process.cwd(), 'test-results/jenkins-showcase/junit.xml');
const REPORT_DIR = path.join(process.cwd(), 'test-results/jenkins-showcase');
const REPORT_TXT = path.join(REPORT_DIR, 'bfa-per-test-report.txt');
const REPORT_HTML = path.join(REPORT_DIR, 'bfa-per-test-report.html');

const BFA_PREFIX = '[BFA:';
const NO_RULE_PREFIX = '[NO BFA RULE]';

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

function encodeXmlAttr(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseTestCases(xml) {
  const blocks = xml.match(/<testcase[\s\S]*?<\/testcase>/g) || [];

  return blocks.map((block, index) => {
    const name = decodeXml(block.match(/name="([^"]*)"/)?.[1] ?? 'unknown');
    const failed = block.includes('<failure');
    const failureBody = failed
      ? decodeXml(
          block.match(/<failure[\s\S]*?<!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ??
            block.match(/<failure[^>]*>([\s\S]*?)<\/failure>/)?.[1] ??
            '',
        )
      : '';

    return { block, index, name, failed, failureBody };
  });
}

function stripExistingPrefix(name) {
  if (name.startsWith(BFA_PREFIX)) {
    return name.replace(/^\[BFA: [^\]]+\]\s*/, '');
  }
  if (name.startsWith(NO_RULE_PREFIX)) {
    return name.replace(/^\[NO BFA RULE\]\s*/, '');
  }
  return name;
}

function shortTestName(fullName) {
  const cleanName = stripExistingPrefix(fullName);
  const parts = cleanName.split(' › ');
  return parts.length > 1 ? parts[parts.length - 1] : cleanName;
}

function errorSnippet(failureBody) {
  const lines = failureBody
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const errorLine =
    lines.find((line) => line.startsWith('Error:')) ??
    lines.find((line) => !line.includes('at ') && !line.startsWith('>')) ??
    lines[0] ??
    'Unknown error';

  return errorLine.replace(/^Error:\s*/, '').slice(0, 140);
}

function matchBfaRule(failureBody) {
  for (const rule of BFA_RULES) {
    if (rule.pattern.test(failureBody)) {
      return rule.name;
    }
  }
  return null;
}

function buildDisplayPrefix(matchedRule) {
  return matchedRule ? `[BFA: ${matchedRule}]` : NO_RULE_PREFIX;
}

function buildRows(failedTests) {
  return failedTests.map((test) => {
    const matchedRule = matchBfaRule(test.failureBody);
    return {
      testName: shortTestName(test.name),
      fullName: stripExistingPrefix(test.name),
      matchedRule,
      errorSnippet: errorSnippet(test.failureBody),
      action: matchedRule
        ? 'Known issue — check Identified problems on build page'
        : 'No BFA rule — investigate manually',
      status: matchedRule ? 'MATCH' : 'NO_RULE',
    };
  });
}

function enrichJUnitXml(xml, failedTests) {
  let enriched = xml;

  for (const test of failedTests) {
    const matchedRule = matchBfaRule(test.failureBody);
    const cleanName = stripExistingPrefix(test.name);
    const prefixedName = `${buildDisplayPrefix(matchedRule)} ${cleanName}`;
    const updatedBlock = test.block.replace(
      /name="[^"]*"/,
      `name="${encodeXmlAttr(prefixedName)}"`,
    );

    enriched = enriched.replace(test.block, updatedBlock);
  }

  return enriched;
}

function buildTextReport(rows) {
  const matched = rows.filter((row) => row.status === 'MATCH');
  const unmatched = rows.filter((row) => row.status === 'NO_RULE');

  const lines = [
    '================================================================',
    'BFA FAILED TESTS REPORT',
    '================================================================',
    '',
    'Failed tests were labeled in Jenkins Test Result (All Failed Tests).',
    'Look for prefixes: [BFA: ...] or [NO BFA RULE]',
    '',
    `KNOWN BFA ISSUES (${matched.length})`,
    ...matched.map(
      (row) =>
        `  [BFA: ${row.matchedRule}] ${row.testName}\n             ${row.errorSnippet}`,
    ),
    '',
    `NO BFA RULE (${unmatched.length})`,
    ...unmatched.map(
      (row) => `  [NO BFA RULE] ${row.testName}\n             ${row.errorSnippet}`,
    ),
    '',
    'HTML report: test-results/jenkins-showcase/bfa-per-test-report.html',
    '================================================================',
  ];

  return lines.join('\n');
}

function buildHtmlReport(rows) {
  const matchedCount = rows.filter((row) => row.status === 'MATCH').length;
  const unmatchedCount = rows.length - matchedCount;

  const rowsHtml = rows
    .map((row) => {
      const cssClass = row.status === 'MATCH' ? 'match' : 'no-rule';
      const badge = row.matchedRule
        ? `<span class="badge match">BFA: ${escapeHtml(row.matchedRule)}</span>`
        : `<span class="badge no-rule">NO BFA RULE</span>`;

      return `
        <tr class="${cssClass}">
          <td>${badge}</td>
          <td>${escapeHtml(row.testName)}</td>
          <td>${escapeHtml(row.matchedRule ?? '—')}</td>
          <td><code>${escapeHtml(row.errorSnippet)}</code></td>
          <td>${escapeHtml(row.action)}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>All Failed Tests — BFA Analysis</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
    h1 { font-size: 22px; margin-bottom: 8px; }
    .summary { display: flex; gap: 12px; margin: 16px 0 24px; }
    .summary-card { padding: 12px 16px; border-radius: 8px; border: 1px solid #ddd; min-width: 160px; }
    .summary-card strong { display: block; font-size: 24px; }
    .summary-card.match { background: #eefaf0; border-color: #cde8d1; }
    .summary-card.no-rule { background: #fff3f3; border-color: #f0caca; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
    tr.match { background: #f8fff9; }
    tr.no-rule { background: #fffafa; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: bold; }
    .badge.match { background: #d9f2dd; color: #1f6b2d; }
    .badge.no-rule { background: #fde2e2; color: #9b1c1c; }
    code { font-family: Consolas, monospace; font-size: 12px; }
    .hint { color: #555; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>All Failed Tests — BFA Analysis</h1>
  <p class="hint">
    Same labels are also injected into Jenkins <strong>Test Result → All Failed Tests</strong>
    as name prefixes: <code>[BFA: Rule name]</code> or <code>[NO BFA RULE]</code>.
  </p>
  <div class="summary">
    <div class="summary-card match"><strong>${matchedCount}</strong> known BFA issues</div>
    <div class="summary-card no-rule"><strong>${unmatchedCount}</strong> need manual investigation</div>
    <div class="summary-card"><strong>${rows.length}</strong> failed tests total</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Label</th>
        <th>Test</th>
        <th>BFA rule</th>
        <th>Error</th>
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
    console.log('BFA failed-tests report skipped: junit.xml not found.');
    process.exit(0);
  }

  const originalXml = fs.readFileSync(JUNIT_PATH, 'utf8');
  const testCases = parseTestCases(originalXml);
  const failedTests = testCases.filter((test) => test.failed);
  const rows = buildRows(failedTests);
  const enrichedXml = enrichJUnitXml(originalXml, failedTests);
  const textReport = buildTextReport(rows);
  const htmlReport = buildHtmlReport(rows);

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(JUNIT_PATH, enrichedXml, 'utf8');
  fs.writeFileSync(REPORT_TXT, textReport, 'utf8');
  fs.writeFileSync(REPORT_HTML, htmlReport, 'utf8');

  console.log(`\n${textReport}\n`);
  console.log(`Updated Jenkins JUnit names in: ${JUNIT_PATH}`);
  console.log(`HTML report: ${REPORT_HTML}`);
}

main();
