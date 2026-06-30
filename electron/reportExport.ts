type JsonRecord = Record<string, unknown>;

interface ExportWarning {
  title: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  recommendedAction: string;
}

const asRecord = (value: unknown): JsonRecord => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as JsonRecord;
  }

  return {};
};

const asArray = (value: unknown): JsonRecord[] => (Array.isArray(value) ? value.map(asRecord) : []);

const asString = (value: unknown, fallback = 'Unavailable') => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return fallback;
};

const asNumber = (value: unknown, fallback = 0) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

const asBoolean = (value: unknown) => value === true;

const escapeHtml = (value: unknown) =>
  asString(value, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalize = (value: unknown) => asString(value, '').trim().toLowerCase();

const isDisabledStatus = (value: unknown) => {
  const status = normalize(value);
  return status === 'off' || status === 'disabled' || status.includes('disabled');
};

const getSection = (report: JsonRecord, name: string) => asRecord(report[name]);

const getHealthLabel = (score: number) => {
  if (score >= 90) return 'Healthy';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Needs Attention';
  if (score >= 40) return 'Poor';
  return 'Critical';
};

const calculateHealthScore = (report: JsonRecord) => {
  const uptime = getSection(report, 'uptime');
  const storage = getSection(report, 'storage');
  const updates = getSection(report, 'updates');
  const security = getSection(report, 'security');
  const events = getSection(report, 'events');
  const printers = getSection(report, 'printers');
  const performance = getSection(report, 'performance');
  const drives = asArray(storage.drives);
  const firewallProfiles = asArray(security.firewallProfiles);
  const failedLogins = asArray(events.failedLoginsLast24h);
  const systemErrors = asArray(events.recentSystemErrors);
  const appErrors = asArray(events.recentApplicationErrors);
  const mappedDrives = asArray(report.mappedDrives);

  let score = 100;

  if (asNumber(uptime.uptimeDays) > 14) score -= 8;
  if (drives.some((drive) => asNumber(drive.freeGB) < 10)) score -= 15;
  if (drives.some((drive) => asNumber(drive.freePercent) < 10)) score -= 15;
  if (asBoolean(updates.pendingReboot)) score -= 10;
  if (isDisabledStatus(security.bitlockerStatus)) score -= 15;
  if (isDisabledStatus(security.defenderStatus)) score -= 20;
  if (firewallProfiles.some((profile) => !asBoolean(profile.enabled))) score -= 15;
  if (failedLogins.length > 0) score -= 8;
  if (systemErrors.some((event) => normalize(event.levelDisplayName) === 'critical')) score -= 15;
  if (appErrors.length > 0) score -= 10;
  if (mappedDrives.some((drive) => normalize(drive.status).includes('disconnected'))) score -= 8;
  if (normalize(printers.spoolerStatus) !== 'running' && normalize(printers.spoolerStatus) !== 'unavailable') score -= 8;
  if (asNumber(performance.ramUsagePercent) > 90) score -= 10;

  return Math.max(0, Math.min(100, score));
};

const generateWarnings = (report: JsonRecord): ExportWarning[] => {
  const storage = getSection(report, 'storage');
  const updates = getSection(report, 'updates');
  const uptime = getSection(report, 'uptime');
  const security = getSection(report, 'security');
  const events = getSection(report, 'events');
  const printers = getSection(report, 'printers');
  const performance = getSection(report, 'performance');
  const drives = asArray(storage.drives);
  const firewallProfiles = asArray(security.firewallProfiles);
  const mappedDrives = asArray(report.mappedDrives);
  const systemErrors = asArray(events.recentSystemErrors);
  const appErrors = asArray(events.recentApplicationErrors);
  const failedLogins = asArray(events.failedLoginsLast24h);
  const warnings: ExportWarning[] = [];

  const lowDrives = drives.filter((drive) => asNumber(drive.freeGB) < 10 || asNumber(drive.freePercent) < 10);
  if (lowDrives.length > 0) {
    warnings.push({
      title: 'Low Disk Space',
      severity: 'critical',
      description: `Drive ${lowDrives.map((drive) => asString(drive.name)).join(', ')} is below the expected free-space threshold.`,
      recommendedAction: 'Free disk space and confirm at least 10 GB and 10% free space remains.',
    });
  }

  if (asBoolean(updates.pendingReboot)) {
    warnings.push({ title: 'Pending Reboot', severity: 'warning', description: 'Windows reports a pending reboot.', recommendedAction: 'Restart the endpoint and re-run triage.' });
  }

  if (asNumber(uptime.uptimeDays) > 14) {
    warnings.push({ title: 'High Uptime', severity: 'warning', description: `Device uptime is ${asNumber(uptime.uptimeDays)} days.`, recommendedAction: 'Restart the endpoint during an approved support window.' });
  }

  if (isDisabledStatus(security.bitlockerStatus)) {
    warnings.push({ title: 'BitLocker Disabled', severity: 'critical', description: 'BitLocker protection appears disabled.', recommendedAction: 'Verify endpoint encryption compliance.' });
  }

  if (isDisabledStatus(security.defenderStatus)) {
    warnings.push({ title: 'Defender Disabled', severity: 'critical', description: 'Microsoft Defender is not reporting an enabled state.', recommendedAction: 'Restore antivirus protection or escalate.' });
  }

  const disabledFirewalls = firewallProfiles.filter((profile) => !asBoolean(profile.enabled));
  if (disabledFirewalls.length > 0) {
    warnings.push({ title: 'Firewall Disabled', severity: 'critical', description: `Firewall profile ${disabledFirewalls.map((profile) => asString(profile.name)).join(', ')} is disabled.`, recommendedAction: 'Re-enable the affected firewall profile or verify an approved exception.' });
  }

  if (failedLogins.length > 0) {
    warnings.push({ title: 'Failed Logins Detected', severity: 'warning', description: `${failedLogins.length} failed login event(s) were found in the last 24 hours.`, recommendedAction: 'Review account/source details and escalate suspicious patterns.' });
  }

  if (systemErrors.length > 0) {
    warnings.push({ title: 'Recent System Errors', severity: systemErrors.some((event) => normalize(event.levelDisplayName) === 'critical') ? 'critical' : 'warning', description: `${systemErrors.length} recent system event(s) were found.`, recommendedAction: 'Review recurring providers and event IDs.' });
  }

  if (appErrors.length > 0) {
    warnings.push({ title: 'Recent Application Crashes', severity: 'warning', description: `${appErrors.length} recent application error event(s) were found.`, recommendedAction: 'Repair, update, or reinstall the affected application if it matches the user report.' });
  }

  if (normalize(printers.spoolerStatus) !== 'running' && normalize(printers.spoolerStatus) !== 'unavailable') {
    warnings.push({ title: 'Print Spooler Stopped', severity: 'warning', description: `The print spooler service is ${asString(printers.spoolerStatus)}.`, recommendedAction: 'Start the Print Spooler service and verify printing.' });
  }

  const disconnectedDrives = mappedDrives.filter((drive) => normalize(drive.status).includes('disconnected'));
  if (disconnectedDrives.length > 0) {
    warnings.push({ title: 'Mapped Drive Disconnected', severity: 'warning', description: `Mapped drive ${disconnectedDrives.map((drive) => asString(drive.driveLetter)).join(', ')} is disconnected.`, recommendedAction: 'Verify VPN/domain connectivity and remap if needed.' });
  }

  if (asNumber(performance.ramUsagePercent) > 90) {
    warnings.push({ title: 'High RAM Usage', severity: 'warning', description: `Memory usage is ${asNumber(performance.ramUsagePercent)}%.`, recommendedAction: 'Review high-memory processes and reboot if usage remains high.' });
  }

  return warnings;
};

const generateTicketNotes = (report: JsonRecord, warnings: ExportWarning[]) => {
  const uptime = getSection(report, 'uptime');
  const updates = getSection(report, 'updates');
  const storage = getSection(report, 'storage');
  const events = getSection(report, 'events');
  const printers = getSection(report, 'printers');
  const lowDrives = asArray(storage.drives).filter((drive) => asNumber(drive.freeGB) < 10 || asNumber(drive.freePercent) < 10);
  const diskStatus = lowDrives.length > 0 ? lowDrives.map((drive) => `${asString(drive.name)} low space, ${asNumber(drive.freeGB).toFixed(1)} GB free`).join('; ') : 'No low disk space detected';
  const mappedDriveIssues = asArray(report.mappedDrives).filter((drive) => normalize(drive.status).includes('disconnected')).length;
  const recentErrors = asArray(events.recentSystemErrors).length + asArray(events.recentApplicationErrors).length;
  const actions = warnings.length > 0 ? warnings.slice(0, 3).map((warning) => warning.recommendedAction) : ['No immediate remediation required from this triage report.', 'Confirm the user can reproduce or no longer reproduce the issue.', 'Re-run triage if symptoms continue.'];

  return `Issue:\nEndpoint triage scan performed for reported device issue.\n\nFindings:\n- Device: ${asString(report.hostname)}\n- User: ${asString(report.loggedInUser)}\n- Uptime: ${asNumber(uptime.uptimeDays)} days\n- Disk status: ${diskStatus}\n- Pending reboot: ${asBoolean(updates.pendingReboot) ? 'Yes' : 'No'}\n- Recent errors: ${recentErrors} found\n- Failed logins: ${asArray(events.failedLoginsLast24h).length} found\n- Mapped drive issues: ${mappedDriveIssues} found\n- Printer status: Spooler ${asString(printers.spoolerStatus).toLowerCase()}\n\nRecommended Actions:\n${actions.map((action) => `- ${action}`).join('\n')}\n\nVerification Steps:\n- Confirm user can reproduce or no longer reproduce the issue.\n- Confirm affected app/service works normally.\n- Confirm no immediate recurring errors appear.\n\nFinal Ticket Note:\nPerformed endpoint triage on ${asString(report.hostname)} for ${asString(report.loggedInUser)}. Findings included ${warnings.length > 0 ? warnings.map((warning) => warning.title.toLowerCase()).join(', ') : 'no immediate warnings'}. Recommended actions were documented above.`;
};

const formatDate = (value: unknown) => {
  const text = asString(value, '');
  if (!text) return 'Unavailable';

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return date.toLocaleString();
};

const section = (title: string, body: string) => `<section class="panel"><h2>${escapeHtml(title)}</h2>${body}</section>`;

const keyValueGrid = (items: Array<[string, unknown]>) =>
  `<div class="kv-grid">${items.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</div>`;

const table = (headers: string[], rows: unknown[][]) => {
  if (rows.length === 0) {
    return '<p class="muted">No records found.</p>';
  }

  return `<table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
};

export const generateStandaloneHtmlReport = (report: JsonRecord) => {
  const os = getSection(report, 'os');
  const hardware = getSection(report, 'hardware');
  const uptime = getSection(report, 'uptime');
  const network = getSection(report, 'network');
  const storage = getSection(report, 'storage');
  const performance = getSection(report, 'performance');
  const security = getSection(report, 'security');
  const updates = getSection(report, 'updates');
  const events = getSection(report, 'events');
  const printers = getSection(report, 'printers');
  const permissions = getSection(report, 'permissions');
  const warnings = generateWarnings(report);
  const score = calculateHealthScore(report);
  const ticketNotes = generateTicketNotes(report, warnings);

  const warningCards = warnings.length > 0
    ? `<div class="warning-grid">${warnings.map((warning) => `<article class="warning ${warning.severity}"><strong>${escapeHtml(warning.title)}</strong><span>${escapeHtml(warning.severity)}</span><p>${escapeHtml(warning.description)}</p><p><b>Recommended:</b> ${escapeHtml(warning.recommendedAction)}</p></article>`).join('')}</div>`
    : '<p class="muted">No warnings generated.</p>';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Endpoint Triage Report - ${escapeHtml(report.hostname)}</title>
  <style>
    body { margin: 0; background: #020617; color: #e2e8f0; font-family: Segoe UI, Arial, sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 32px; }
    header { border: 1px solid #1e293b; background: #0f172a; padding: 28px; margin-bottom: 20px; }
    h1 { margin: 0; color: #f8fafc; font-size: 30px; }
    h2 { margin: 0 0 18px; color: #f8fafc; font-size: 18px; }
    .muted { color: #94a3b8; }
    .topline { margin-top: 8px; color: #94a3b8; }
    .score { display: inline-block; margin-top: 18px; border: 1px solid #22d3ee66; background: #22d3ee1a; color: #67e8f9; padding: 14px 18px; font-weight: 800; }
    .panel { border: 1px solid #1e293b; background: #0f172a; padding: 22px; margin: 20px 0; break-inside: avoid; }
    .kv-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    dt { color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: .12em; }
    dd { margin: 6px 0 0; color: #f1f5f9; font-weight: 600; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; color: #94a3b8; background: #1e293b; padding: 10px; text-transform: uppercase; letter-spacing: .08em; font-size: 11px; }
    td { border-top: 1px solid #1e293b; padding: 10px; vertical-align: top; overflow-wrap: anywhere; }
    .warning-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .warning { border: 1px solid #334155; background: #1e293b80; padding: 14px; }
    .warning span { float: right; text-transform: uppercase; font-size: 11px; letter-spacing: .1em; }
    .warning.critical { border-color: #f8717166; }
    .warning.warning { border-color: #fbbf2466; }
    pre { white-space: pre-wrap; background: #020617; border: 1px solid #1e293b; padding: 16px; color: #e2e8f0; }
    @media print { body { background: #fff; color: #111827; } header, .panel { background: #fff; border-color: #cbd5e1; } h1, h2, dd { color: #111827; } .muted, dt { color: #475569; } }
  </style>
</head>
<body>
<main>
  <header>
    <h1>${escapeHtml(report.hostname)}</h1>
    <div class="topline">User: ${escapeHtml(report.loggedInUser)} | Scan time: ${escapeHtml(formatDate(report.scanTime))} | Report ID: ${escapeHtml(report.reportId)}</div>
    <div class="score">Health Score: ${score} (${escapeHtml(getHealthLabel(score))})</div>
  </header>
  ${section('Warnings', warningCards)}
  ${section('Device Summary', keyValueGrid([
    ['Hostname', report.hostname],
    ['Logged-in User', report.loggedInUser],
    ['OS', `${asString(os.name)} ${asString(os.version)} build ${asString(os.build)}`],
    ['Architecture', os.architecture],
    ['Manufacturer', hardware.manufacturer],
    ['Model', hardware.model],
    ['Serial Number', hardware.serialNumber],
    ['Uptime', `${asNumber(uptime.uptimeDays)} days`],
    ['CPU', performance.cpuName],
    ['RAM', `${asNumber(performance.ramUsedGB)} GB / ${asNumber(performance.ramTotalGB)} GB (${asNumber(performance.ramUsagePercent)}%)`],
    ['Admin Context', asBoolean(permissions.isAdmin) ? 'Yes' : 'No'],
    ['Limited Fields', Array.isArray(permissions.limitedFields) ? permissions.limitedFields.join(', ') : 'None'],
  ]))}
  ${section('Network', keyValueGrid([
    ['IP Addresses', Array.isArray(network.ipAddresses) ? network.ipAddresses.join(', ') : 'None'],
    ['DNS Servers', Array.isArray(network.dnsServers) ? network.dnsServers.join(', ') : 'None'],
    ['Default Gateway', network.defaultGateway],
    ['Domain/Workgroup', network.domainOrWorkgroup],
  ]) + table(['Adapter', 'Status', 'MAC', 'IP Addresses', 'DNS Servers'], asArray(network.adapters).map((adapter) => [adapter.name, adapter.status, adapter.macAddress, Array.isArray(adapter.ipAddresses) ? adapter.ipAddresses.join(', ') : '', Array.isArray(adapter.dnsServers) ? adapter.dnsServers.join(', ') : ''])))}
  ${section('Storage', table(['Drive', 'File System', 'Total GB', 'Free GB', 'Free %'], asArray(storage.drives).map((drive) => [drive.name, drive.fileSystem, drive.totalGB, drive.freeGB, drive.freePercent])))}
  ${section('Security', keyValueGrid([
    ['BitLocker', security.bitlockerStatus],
    ['Defender', security.defenderStatus],
    ['Local Admins', Array.isArray(security.localAdmins) ? security.localAdmins.join(', ') : 'None'],
  ]) + table(['Firewall Profile', 'Enabled'], asArray(security.firewallProfiles).map((profile) => [profile.name, asBoolean(profile.enabled) ? 'Yes' : 'No'])))}
  ${section('Updates', keyValueGrid([['Pending Reboot', asBoolean(updates.pendingReboot) ? 'Yes' : 'No']]) + table(['Hotfix', 'Installed On', 'Description'], asArray(updates.lastHotfixes).map((hotfix) => [hotfix.hotfixId, hotfix.installedOn, hotfix.description])))}
  ${section('Events', '<h3>Failed Logins</h3>' + table(['Time', 'Provider', 'Event ID', 'Level', 'Message'], asArray(events.failedLoginsLast24h).map((event) => [formatDate(event.timeCreated), event.providerName, event.eventId, event.levelDisplayName, event.message])) + '<h3>System Errors</h3>' + table(['Time', 'Provider', 'Event ID', 'Level', 'Message'], asArray(events.recentSystemErrors).map((event) => [formatDate(event.timeCreated), event.providerName, event.eventId, event.levelDisplayName, event.message])) + '<h3>Application Errors</h3>' + table(['Time', 'Provider', 'Event ID', 'Level', 'Message'], asArray(events.recentApplicationErrors).map((event) => [formatDate(event.timeCreated), event.providerName, event.eventId, event.levelDisplayName, event.message])))}
  ${section('Printers', keyValueGrid([['Spooler Status', printers.spoolerStatus]]) + table(['Printer', 'Default', 'Status'], asArray(printers.installedPrinters).map((printer) => [printer.name, asBoolean(printer.isDefault) ? 'Yes' : 'No', printer.status])))}
  ${section('Mapped Drives', table(['Drive', 'Remote Path', 'Status'], asArray(report.mappedDrives).map((drive) => [drive.driveLetter, drive.remotePath, drive.status])))}
  ${section('Installed Apps', table(['Name', 'Version', 'Publisher', 'Install Date'], asArray(report.installedApps).map((app) => [app.name, app.version, app.publisher, app.installDate])))}
  ${section('Ticket Notes', `<pre>${escapeHtml(ticketNotes)}</pre>`)}
</main>
</body>
</html>`;
};
