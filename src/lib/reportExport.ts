import type { EndpointTriageReport, EventRecord, TriageWarning } from '../types/triage';
import { calculateHealthScore } from './healthScore';
import { generateTicketNotes } from './ticketNotes';
import { generateWarnings } from './warningEngine';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || 'Unavailable';
  }

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

const eventsTable = (events: EventRecord[]) =>
  table(
    ['Time', 'Provider', 'Event ID', 'Level', 'Message'],
    events.map((event) => [formatDate(event.timeCreated), event.providerName, event.eventId, event.levelDisplayName, event.message]),
  );

const warningCards = (warnings: TriageWarning[]) => {
  if (warnings.length === 0) {
    return '<p class="muted">No warnings generated.</p>';
  }

  return `<div class="warning-grid">${warnings
    .map(
      (warning) =>
        `<article class="warning ${warning.severity}"><strong>${escapeHtml(warning.title)}</strong><span>${escapeHtml(warning.severity)}</span><p>${escapeHtml(warning.description)}</p><p><b>Recommended:</b> ${escapeHtml(warning.recommendedAction)}</p></article>`,
    )
    .join('')}</div>`;
};

export const generateStandaloneHtmlReport = (report: EndpointTriageReport) => {
  const health = calculateHealthScore(report);
  const warnings = generateWarnings(report);
  const ticketNotes = generateTicketNotes(report, warnings);

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
    h3 { margin: 20px 0 10px; color: #cbd5e1; font-size: 14px; text-transform: uppercase; letter-spacing: .1em; }
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
    <div class="score">Health Score: ${health.score} (${escapeHtml(health.label)})</div>
  </header>
  ${section('Warnings', warningCards(warnings))}
  ${section('Device Summary', keyValueGrid([
    ['Hostname', report.hostname],
    ['Logged-in User', report.loggedInUser],
    ['OS', `${report.os.name} ${report.os.version} build ${report.os.build}`],
    ['Architecture', report.os.architecture],
    ['Manufacturer', report.hardware.manufacturer],
    ['Model', report.hardware.model],
    ['Serial Number', report.hardware.serialNumber],
    ['Uptime', `${report.uptime.uptimeDays} days`],
    ['CPU', report.performance.cpuName],
    ['RAM', `${report.performance.ramUsedGB} GB / ${report.performance.ramTotalGB} GB (${report.performance.ramUsagePercent}%)`],
    ['Admin Context', report.permissions.isAdmin ? 'Yes' : 'No'],
    ['Limited Fields', report.permissions.limitedFields.length ? report.permissions.limitedFields.join(', ') : 'None'],
  ]))}
  ${section('Network', keyValueGrid([
    ['IP Addresses', report.network.ipAddresses.join(', ') || 'None'],
    ['DNS Servers', report.network.dnsServers.join(', ') || 'None'],
    ['Default Gateway', report.network.defaultGateway],
    ['Domain/Workgroup', report.network.domainOrWorkgroup],
  ]) + table(['Adapter', 'Status', 'MAC', 'IP Addresses', 'DNS Servers'], report.network.adapters.map((adapter) => [adapter.name, adapter.status, adapter.macAddress, adapter.ipAddresses.join(', '), adapter.dnsServers.join(', ')])))}
  ${section('Storage', table(['Drive', 'File System', 'Total GB', 'Free GB', 'Free %'], report.storage.drives.map((drive) => [drive.name, drive.fileSystem, drive.totalGB, drive.freeGB, drive.freePercent])))}
  ${section('Security', keyValueGrid([
    ['BitLocker', report.security.bitlockerStatus],
    ['Defender', report.security.defenderStatus],
    ['Local Admins', report.security.localAdmins.join(', ') || 'None'],
  ]) + table(['Firewall Profile', 'Enabled'], report.security.firewallProfiles.map((profile) => [profile.name, profile.enabled ? 'Yes' : 'No'])))}
  ${section('Updates', keyValueGrid([['Pending Reboot', report.updates.pendingReboot ? 'Yes' : 'No']]) + table(['Hotfix', 'Installed On', 'Description'], report.updates.lastHotfixes.map((hotfix) => [hotfix.hotfixId, hotfix.installedOn, hotfix.description])))}
  ${section('Events', '<h3>Failed Logins</h3>' + eventsTable(report.events.failedLoginsLast24h) + '<h3>System Errors</h3>' + eventsTable(report.events.recentSystemErrors) + '<h3>Application Errors</h3>' + eventsTable(report.events.recentApplicationErrors))}
  ${section('Printers', keyValueGrid([['Spooler Status', report.printers.spoolerStatus]]) + table(['Printer', 'Default', 'Status'], report.printers.installedPrinters.map((printer) => [printer.name, printer.isDefault ? 'Yes' : 'No', printer.status])))}
  ${section('Mapped Drives', table(['Drive', 'Remote Path', 'Status'], report.mappedDrives.map((drive) => [drive.driveLetter, drive.remotePath, drive.status])))}
  ${section('Installed Apps', table(['Name', 'Version', 'Publisher', 'Install Date'], report.installedApps.map((app) => [app.name, app.version, app.publisher, app.installDate])))}
  ${section('Ticket Notes', `<pre>${escapeHtml(ticketNotes)}</pre>`)}
</main>
</body>
</html>`;
};
