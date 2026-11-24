import { describe, expect, it } from 'vitest';
import { generateStandaloneHtmlReport } from './reportExport';
import { makeReport } from '../test/makeReport';

describe('generateStandaloneHtmlReport', () => {
  it('escapes HTML in collected values', () => {
    const html = generateStandaloneHtmlReport(makeReport({ hostname: '<script>alert(1)</script>' }));
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
