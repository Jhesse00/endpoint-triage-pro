import { describe, expect, it } from 'vitest';
import { calculateHealthScore, getHealthLabel } from './healthScore';
import { makeReport } from '../test/makeReport';

describe('calculateHealthScore', () => {
  it('scores a healthy endpoint 100', () => {
    expect(calculateHealthScore(makeReport())).toEqual({ score: 100, label: 'Healthy' });
  });

  it('deducts 10 for pending reboot and 15 for BitLocker off', () => {
    const report = makeReport({
      updates: { pendingReboot: true, lastHotfixes: [] },
      security: { ...makeReport().security, bitlockerStatus: 'Off' },
    });
    expect(calculateHealthScore(report)).toEqual({ score: 75, label: 'Good' });
  });

  it('clamps at 0 when everything is wrong', () => {
    const event = { timeCreated: '', providerName: 'x', eventId: 1, levelDisplayName: 'Critical', message: '' };
    const report = makeReport({
      uptime: { lastBootTime: '', uptimeDays: 30 },
      storage: { drives: [{ name: 'C:', fileSystem: 'NTFS', totalGB: 100, freeGB: 2, freePercent: 2 }] },
      updates: { pendingReboot: true, lastHotfixes: [] },
      security: { bitlockerStatus: 'Off', defenderStatus: 'Disabled', firewallProfiles: [{ name: 'Public', enabled: false }], localAdmins: [] },
      events: { failedLoginsLast24h: [event], recentSystemErrors: [event], recentApplicationErrors: [event] },
      mappedDrives: [{ driveLetter: 'S:', remotePath: '\\\\fs\\share', status: 'Disconnected' }],
      printers: { spoolerStatus: 'Stopped', installedPrinters: [] },
      performance: { cpuName: 'x', cpuLoadPercent: 99, ramTotalGB: 8, ramUsedGB: 7.8, ramUsagePercent: 97 },
    });
    expect(calculateHealthScore(report)).toEqual({ score: 0, label: 'Critical' });
  });
});

describe('getHealthLabel', () => {
  it.each([[90, 'Healthy'], [75, 'Good'], [60, 'Needs Attention'], [40, 'Poor'], [39, 'Critical']] as const)(
    '%i -> %s', (score, label) => expect(getHealthLabel(score)).toBe(label),
  );
});
