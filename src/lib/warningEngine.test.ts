import { describe, expect, it } from 'vitest';
import { generateWarnings } from './warningEngine';
import { makeReport } from '../test/makeReport';

const ids = (report: ReturnType<typeof makeReport>) => generateWarnings(report).map((warning) => warning.id);

describe('generateWarnings', () => {
  it('raises pending-reboot only when reboot is pending', () => {
    expect(ids(makeReport())).not.toContain('pending-reboot');
    expect(ids(makeReport({ updates: { pendingReboot: true, lastHotfixes: [] } }))).toContain('pending-reboot');
  });

  it('raises bitlocker-disabled when BitLocker is off', () => {
    const report = makeReport({ security: { ...makeReport().security, bitlockerStatus: 'Off' } });
    expect(ids(report)).toContain('bitlocker-disabled');
  });
});
