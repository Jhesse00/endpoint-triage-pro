export interface EndpointTriageReport {
  status?: 'PermissionRequired';
  message?: string;
  reportId: string;
  scanTime: string;
  hostname: string;
  loggedInUser: string;
  os: {
    name: string;
    version: string;
    build: string;
    architecture: string;
  };
  hardware: {
    manufacturer: string;
    model: string;
    serialNumber: string;
  };
  uptime: {
    lastBootTime: string;
    uptimeDays: number;
  };
  network: {
    ipAddresses: string[];
    dnsServers: string[];
    defaultGateway: string;
    domainOrWorkgroup: string;
    adapters: NetworkAdapter[];
  };
  storage: {
    drives: DriveInfo[];
  };
  performance: {
    cpuName: string;
    cpuLoadPercent: number | null;
    ramTotalGB: number;
    ramUsedGB: number;
    ramUsagePercent: number;
  };
  security: {
    bitlockerStatus: string;
    defenderStatus: string;
    firewallProfiles: FirewallProfile[];
    localAdmins: string[];
  };
  updates: {
    pendingReboot: boolean;
    lastHotfixes: HotfixInfo[];
  };
  events: {
    failedLoginsLast24h: EventRecord[];
    recentSystemErrors: EventRecord[];
    recentApplicationErrors: EventRecord[];
  };
  printers: {
    spoolerStatus: string;
    installedPrinters: PrinterInfo[];
  };
  mappedDrives: MappedDrive[];
  installedApps: InstalledApp[];
  permissions: {
    isAdmin: boolean;
    limitedFields: string[];
  };
}

export interface NetworkAdapter {
  name: string;
  status: string;
  macAddress: string;
  ipAddresses: string[];
  dnsServers: string[];
}

export interface DriveInfo {
  name: string;
  fileSystem: string;
  totalGB: number;
  freeGB: number;
  freePercent: number;
}

export interface FirewallProfile {
  name: string;
  enabled: boolean;
}

export interface HotfixInfo {
  hotfixId: string;
  installedOn: string;
  description: string;
}

export interface EventRecord {
  timeCreated: string;
  providerName: string;
  eventId: number;
  levelDisplayName: string;
  message: string;
}

export interface PrinterInfo {
  name: string;
  isDefault: boolean;
  status: string;
}

export interface MappedDrive {
  driveLetter: string;
  remotePath: string;
  status: string;
}

export interface InstalledApp {
  name: string;
  version: string;
  publisher: string;
  installDate: string;
}

export interface TriageWarning {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  recommendedAction: string;
}
