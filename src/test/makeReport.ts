import type { EndpointTriageReport } from '../types/triage';

export const makeReport = (overrides: Partial<EndpointTriageReport> = {}): EndpointTriageReport => ({
  reportId: 'test-report',
  scanTime: '2026-11-24T15:00:00Z',
  hostname: 'LAB-PC-01',
  loggedInUser: 'LAB\\tester',
  os: { name: 'Windows 11 Pro', version: '10.0.22631', build: '22631', architecture: '64-bit' },
  hardware: { manufacturer: 'Contoso', model: 'Lab VM', serialNumber: 'REDACTED' },
  uptime: { lastBootTime: '2026-11-23T08:00:00Z', uptimeDays: 1 },
  network: { ipAddresses: ['10.0.0.25'], dnsServers: ['10.0.0.2'], defaultGateway: '10.0.0.1', domainOrWorkgroup: 'LAB', adapters: [] },
  storage: { drives: [{ name: 'C:', fileSystem: 'NTFS', totalGB: 256, freeGB: 120, freePercent: 46.9 }] },
  performance: { cpuName: 'Test CPU', cpuLoadPercent: 12, ramTotalGB: 16, ramUsedGB: 6, ramUsagePercent: 37.5 },
  security: {
    bitlockerStatus: 'On', defenderStatus: 'Enabled',
    firewallProfiles: [{ name: 'Domain', enabled: true }, { name: 'Private', enabled: true }, { name: 'Public', enabled: true }],
    localAdmins: ['Administrator'],
  },
  updates: { pendingReboot: false, lastHotfixes: [] },
  events: { failedLoginsLast24h: [], recentSystemErrors: [], recentApplicationErrors: [] },
  printers: { spoolerStatus: 'Running', installedPrinters: [] },
  mappedDrives: [], installedApps: [], permissions: { isAdmin: true, limitedFields: [] },
  ...overrides,
});
