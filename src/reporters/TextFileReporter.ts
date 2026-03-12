import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface Options {
  outputFile?: string;
}

interface Totals {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

class TextFileReporter implements Reporter {
  private outputFile: string;
  private lines: string[] = [];
  private startTime!: Date;
  private totals: Totals = { total: 0, passed: 0, failed: 0, skipped: 0 };

  constructor(options: Options = {}) {
    this.outputFile = options.outputFile ?? 'logs/test-run.log';
  }

  onBegin(): void {
    this.startTime = new Date();
    this.lines.push(`=== TEST RUN: ${this.startTime.toISOString()} ===`);
    this.lines.push('');
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const status = result.status.toUpperCase().padEnd(7);
    const duration = (result.duration / 1000).toFixed(1) + 's';
    const title = test.titlePath().slice(1).join(' > ');

    this.lines.push(`[${status}] ${title} (${duration})`);

    if (result.status === 'failed' && result.error) {
      const msg = result.error.message?.split('\n')[0] ?? '';
      this.lines.push(`  Error: ${msg}`);
    }

    this.totals.total++;
    if (result.status === 'passed') this.totals.passed++;
    else if (result.status === 'failed') this.totals.failed++;
    else this.totals.skipped++;
  }

  onEnd(_result: FullResult): void {
    const durationSec = ((Date.now() - this.startTime.getTime()) / 1000).toFixed(0);

    this.lines.push('');
    this.lines.push('--- SUMMARY ---');
    this.lines.push(`Total:    ${this.totals.total}`);
    this.lines.push(`Passed:   ${this.totals.passed}`);
    this.lines.push(`Failed:   ${this.totals.failed}`);
    this.lines.push(`Skipped:  ${this.totals.skipped}`);
    this.lines.push(`Duration: ${durationSec}s`);

    const dir = path.dirname(this.outputFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.outputFile, this.lines.join('\n'), 'utf8');
  }
}

export default TextFileReporter;
