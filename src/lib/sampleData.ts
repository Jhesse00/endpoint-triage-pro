import type { EndpointTriageReport, TriageWarning } from '../types/triage';

export const sampleReport: EndpointTriageReport = {
  reportId: 'sample-2026-06-30-001',
  scanTime: '2026-06-30T14:24:00.000Z',
  hostname: 'HD-WIN11-024',
  loggedInUser: 'CONTOSO\\jsmith',
  os: {
    name: 'Microsoft Windows 11 Pro',
    version: '23H2',
    build: '22631.3737',
    architecture: '64-bit',
  },
  hardware: {
    manufacturer: 'Dell Inc.',
    model: 'Latitude 7440',
    serialNumber: 'DL7440-5KQ92Z3',
  },
  uptime: {
    lastBootTime: '2026-06-11T08:16:41.000Z',
    uptimeDays: 19,
  },
  network: {
    ipAddresses: ['10.42.18.77', 'fe80::5d8c:61af:18f2:1a04'],
    dnsServers: ['10.42.0.10', '10.42.0.11'],
    defaultGateway: '10.42.18.1',
    domainOrWorkgroup: 'CONTOSO.local',
    adapters: [
      {
        name: 'Intel(R) Wi-Fi 6E AX211 160MHz',
        status: 'Up',
        macAddress: '34-13-E8-8A-1E-42',
        ipAddresses: ['10.42.18.77'],
        dnsServers: ['10.42.0.10', '10.42.0.11'],
      },
      {
        name: 'Realtek USB GbE Family Controller',
        status: 'Disconnected',
        macAddress: 'F8-E4-3B-72-19-88',
        ipAddresses: [],
        dnsServers: [],
      },
    ],
  },
  storage: {
    drives: [
      {
        name: 'C:',
        fileSystem: 'NTFS',
        totalGB: 237.4,
        freeGB: 8.2,
        freePercent: 3.5,
      },
      {
        name: 'D:',
        fileSystem: 'NTFS',
        totalGB: 476.8,
        freeGB: 248.6,
        freePercent: 52.2,
      },
    ],
  },
  performance: {
    cpuName: '13th Gen Intel(R) Core(TM) i7-1365U',
    cpuLoadPercent: 27,
    ramTotalGB: 32,
    ramUsedGB: 26.7,
    ramUsagePercent: 83.4,
  },
  security: {
    bitlockerStatus: 'Disabled',
    defenderStatus: 'Enabled',
    firewallProfiles: [
      { name: 'Domain', enabled: true },
      { name: 'Private', enabled: true },
      { name: 'Public', enabled: false },
    ],
    localAdmins: ['CONTOSO\\Endpoint Admins', 'CONTOSO\\HelpDesk Tier 2'],
  },
  updates: {
    pendingReboot: true,
    lastHotfixes: [
      {
        hotfixId: 'KB5039212',
        installedOn: '2026-06-18',
        description: 'Security Update',
      },
      {
        hotfixId: 'KB5037853',
        installedOn: '2026-06-04',
        description: 'Cumulative Update Preview',
      },
      {
        hotfixId: 'KB5037591',
        installedOn: '2026-05-23',
        description: 'Servicing Stack Update',
      },
    ],
  },
  events: {
    failedLoginsLast24h: [
      {
        timeCreated: '2026-06-30T12:14:02.000Z',
        providerName: 'Microsoft-Windows-Security-Auditing',
        eventId: 4625,
        levelDisplayName: 'Information',
        message: 'An account failed to log on. Failure reason: unknown user name or bad password.',
      },
      {
        timeCreated: '2026-06-30T10:58:21.000Z',
        providerName: 'Microsoft-Windows-Security-Auditing',
        eventId: 4625,
        levelDisplayName: 'Information',
        message: 'Failed logon from workstation VPN-GW-02.',
      },
    ],
    recentSystemErrors: [
      {
        timeCreated: '2026-06-30T09:44:28.000Z',
        providerName: 'Service Control Manager',
        eventId: 7031,
        levelDisplayName: 'Error',
        message: 'The Windows Search service terminated unexpectedly.',
      },
      {
        timeCreated: '2026-06-29T16:09:11.000Z',
        providerName: 'Disk',
        eventId: 153,
        levelDisplayName: 'Warning',
        message: 'The IO operation at logical block address was retried.',
      },
    ],
    recentApplicationErrors: [
      {
        timeCreated: '2026-06-30T11:32:55.000Z',
        providerName: 'Application Error',
        eventId: 1000,
        levelDisplayName: 'Error',
        message: 'Faulting application name: Outlook.exe, faulting module name: mso20win32client.dll.',
      },
    ],
  },
  printers: {
    spoolerStatus: 'Running',
    installedPrinters: [
      {
        name: 'HQ-FIN-PRN-02',
        isDefault: true,
        status: 'Ready',
      },
      {
        name: 'Microsoft Print to PDF',
        isDefault: false,
        status: 'Ready',
      },
    ],
  },
  mappedDrives: [
    {
      driveLetter: 'H:',
      remotePath: '\\\\files01\\home\\jsmith',
      status: 'OK',
    },
    {
      driveLetter: 'P:',
      remotePath: '\\\\files02\\projects',
      status: 'Disconnected',
    },
  ],
  installedApps: [
    {
      name: 'Microsoft 365 Apps for enterprise',
      version: '16.0.17726.20160',
      publisher: 'Microsoft Corporation',
      installDate: '2026-04-12',
    },
    {
      name: 'Microsoft Edge',
      version: '126.0.2592.87',
      publisher: 'Microsoft Corporation',
      installDate: '2026-06-20',
    },
    {
      name: 'CrowdStrike Windows Sensor',
      version: '7.16.18614.0',
      publisher: 'CrowdStrike Inc.',
      installDate: '2026-05-09',
    },
    {
      name: 'Cisco Secure Client',
      version: '5.1.4.74',
      publisher: 'Cisco Systems, Inc.',
      installDate: '2026-03-18',
    },
    {
      name: 'Zoom Workplace',
      version: '6.1.1',
      publisher: 'Zoom Video Communications, Inc.',
      installDate: '2026-06-10',
    },
  ],
  permissions: {
    isAdmin: false,
    limitedFields: ['Full security log detail', 'BitLocker protector inventory'],
  },
};

export const sampleWarnings: TriageWarning[] = [
  {
    id: 'low-disk-c',
    title: 'Low Disk Space',
    severity: 'critical',
    description: 'Drive C: has 8.2 GB free, which is below both the 10 GB and 10% operational thresholds.',
    recommendedAction: 'Free disk space, clear temporary files, and review large application caches before reinstalling or updating software.',
  },
  {
    id: 'pending-reboot',
    title: 'Pending Reboot',
    severity: 'warning',
    description: 'Windows reports a pending reboot after recent update activity.',
    recommendedAction: 'Schedule a restart with the user and recheck update status after the reboot completes.',
  },
  {
    id: 'high-uptime',
    title: 'High Uptime',
    severity: 'warning',
    description: 'Device uptime is 19 days. Long uptime can leave updates, driver changes, and policy refreshes incomplete.',
    recommendedAction: 'Restart the endpoint during an approved support window.',
  },
  {
    id: 'bitlocker-disabled',
    title: 'BitLocker Disabled',
    severity: 'critical',
    description: 'BitLocker protection is not enabled on the operating system volume in this sample report.',
    recommendedAction: 'Escalate according to endpoint encryption policy and verify device compliance in management tooling.',
  },
  {
    id: 'mapped-drive-disconnected',
    title: 'Mapped Drive Disconnected',
    severity: 'warning',
    description: 'Mapped drive P: is disconnected from \\\\files02\\projects.',
    recommendedAction: 'Verify VPN/domain connectivity and remap the drive if permissions and network path are valid.',
  },
];

export const sampleTicketNotes = `Issue:
Endpoint triage scan performed for reported device issue.

Findings:
- Device: HD-WIN11-024
- User: CONTOSO\\jsmith
- Uptime: 19 days
- Disk status: C: low space, 8.2 GB free
- Pending reboot: Yes
- Recent errors: 3 found
- Failed logins: 2 found
- Mapped drive issues: 1 found
- Printer status: Spooler running, default printer ready

Recommended Actions:
- Restart endpoint to complete pending updates and policy refresh.
- Free space on C: before additional updates or application repairs.
- Verify BitLocker compliance and mapped drive connectivity.

Verification Steps:
- Confirm user can reproduce or no longer reproduce the issue.
- Confirm affected app/service works normally.
- Confirm no immediate recurring errors appear.

Final Ticket Note:
Performed endpoint triage on HD-WIN11-024 for CONTOSO\\jsmith. Findings included low C: drive free space, pending reboot, high uptime, disabled BitLocker status, failed logon events, and one disconnected mapped drive. Recommended restart, disk cleanup, encryption compliance verification, and mapped drive connectivity validation.`;

export const sampleReports: EndpointTriageReport[] = [
  sampleReport,
  {
    ...sampleReport,
    reportId: 'sample-2026-06-28-002',
    scanTime: '2026-06-28T10:06:00.000Z',
    hostname: 'HD-WIN11-017',
    loggedInUser: 'CONTOSO\\agarcia',
    uptime: {
      lastBootTime: '2026-06-27T07:51:00.000Z',
      uptimeDays: 1,
    },
    updates: {
      ...sampleReport.updates,
      pendingReboot: false,
    },
    storage: {
      drives: [
        {
          name: 'C:',
          fileSystem: 'NTFS',
          totalGB: 476.8,
          freeGB: 132.4,
          freePercent: 27.8,
        },
      ],
    },
    performance: {
      ...sampleReport.performance,
      ramUsagePercent: 61.2,
      ramUsedGB: 19.6,
    },
  },
  {
    ...sampleReport,
    reportId: 'sample-2026-06-25-003',
    scanTime: '2026-06-25T15:38:00.000Z',
    hostname: 'HD-WIN10-088',
    loggedInUser: 'CONTOSO\\tchen',
    os: {
      name: 'Microsoft Windows 10 Enterprise',
      version: '22H2',
      build: '19045.4529',
      architecture: '64-bit',
    },
    hardware: {
      manufacturer: 'Lenovo',
      model: 'ThinkPad T14 Gen 3',
      serialNumber: 'PF3J8K2R',
    },
    uptime: {
      lastBootTime: '2026-06-19T06:22:00.000Z',
      uptimeDays: 6,
    },
  },
];
