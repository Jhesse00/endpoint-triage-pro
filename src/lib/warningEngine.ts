import type { EndpointTriageReport, TriageWarning } from '../types/triage';

const normalize = (value: string) => value.trim().toLowerCase();

const isDisabledStatus = (value: string) => {
  const status = normalize(value);
  return status === 'off' || status === 'disabled' || status.includes('disabled');
};

const listMappedDriveLetters = (drives: Array<{ driveLetter: string }>) => drives.map((drive) => drive.driveLetter).join(', ');

export const generateWarnings = (report: EndpointTriageReport): TriageWarning[] => {
  const warnings: TriageWarning[] = [];
  const drivesUnder10GB = report.storage.drives.filter((drive) => drive.freeGB < 10);
  const drivesUnder10Percent = report.storage.drives.filter((drive) => drive.freePercent < 10);
  const disabledFirewalls = report.security.firewallProfiles.filter((profile) => !profile.enabled);
  const disconnectedDrives = report.mappedDrives.filter((drive) => normalize(drive.status).includes('disconnected'));
  const criticalSystemErrors = report.events.recentSystemErrors.filter((event) => normalize(event.levelDisplayName) === 'critical');

  if (drivesUnder10GB.length > 0 || drivesUnder10Percent.length > 0) {
    const affectedDrives = Array.from(new Set([...drivesUnder10GB, ...drivesUnder10Percent].map((drive) => drive.name)));
    warnings.push({
      id: 'low-disk-space',
      title: 'Low Disk Space',
      severity: 'critical',
      description: `Drive ${affectedDrives.join(', ')} is below the expected free-space threshold. Low disk space can block updates, app repairs, profile writes, and log collection.`,
      recommendedAction: 'Free disk space, clear temporary files, remove stale installers, and confirm at least 10 GB and 10% free space remains.',
    });
  }

  if (report.updates.pendingReboot) {
    warnings.push({
      id: 'pending-reboot',
      title: 'Pending Reboot',
      severity: 'warning',
      description: 'Windows reports a pending reboot after update or system change activity.',
      recommendedAction: 'Schedule a restart with the user and re-run triage after the reboot completes.',
    });
  }

  if (report.uptime.uptimeDays > 14) {
    warnings.push({
      id: 'high-uptime',
      title: 'High Uptime',
      severity: 'warning',
      description: `Device uptime is ${report.uptime.uptimeDays} days, which can leave updates, drivers, and policy refreshes incomplete.`,
      recommendedAction: 'Restart the endpoint during an approved support window, then verify updates and reported symptoms again.',
    });
  }

  if (isDisabledStatus(report.security.bitlockerStatus)) {
    warnings.push({
      id: 'bitlocker-disabled',
      title: 'BitLocker Disabled',
      severity: 'critical',
      description: 'BitLocker protection appears disabled on the endpoint.',
      recommendedAction: 'Escalate according to endpoint encryption policy and verify device compliance in management tooling.',
    });
  }

  if (isDisabledStatus(report.security.defenderStatus)) {
    warnings.push({
      id: 'defender-disabled',
      title: 'Defender Disabled',
      severity: 'critical',
      description: 'Microsoft Defender is not reporting an enabled and protected state.',
      recommendedAction: 'Verify antivirus policy, restart Defender services if appropriate, and escalate if protection cannot be restored.',
    });
  }

  if (disabledFirewalls.length > 0) {
    warnings.push({
      id: 'firewall-disabled',
      title: 'Firewall Disabled',
      severity: 'critical',
      description: `Firewall profile ${disabledFirewalls.map((profile) => profile.name).join(', ')} is disabled.`,
      recommendedAction: 'Re-enable the affected firewall profile or confirm an approved security exception exists.',
    });
  }

  if (report.events.failedLoginsLast24h.length > 0) {
    warnings.push({
      id: 'failed-logins-detected',
      title: 'Failed Logins Detected',
      severity: 'warning',
      description: `${report.events.failedLoginsLast24h.length} failed login event(s) were found in the last 24 hours.`,
      recommendedAction: 'Review source workstation/account details, confirm expected user activity, and escalate suspicious patterns.',
    });
  }

  if (criticalSystemErrors.length > 0) {
    warnings.push({
      id: 'recent-system-errors',
      title: 'Recent System Errors',
      severity: 'critical',
      description: `${criticalSystemErrors.length} critical system event(s) were found in the recent system log sample.`,
      recommendedAction: 'Review the system event details, check related services or drivers, and recheck after remediation.',
    });
  } else if (report.events.recentSystemErrors.length > 0) {
    warnings.push({
      id: 'recent-system-errors',
      title: 'Recent System Errors',
      severity: 'warning',
      description: `${report.events.recentSystemErrors.length} system error or warning event(s) were found in the recent system log sample.`,
      recommendedAction: 'Review recurring providers and event IDs to determine whether they match the reported issue.',
    });
  }

  if (report.events.recentApplicationErrors.length > 0) {
    warnings.push({
      id: 'recent-application-crashes',
      title: 'Recent Application Crashes',
      severity: 'warning',
      description: `${report.events.recentApplicationErrors.length} recent application error event(s) were found.`,
      recommendedAction: 'Match the failing application to the user report, then repair, update, or reinstall the affected app if needed.',
    });
  }

  if (normalize(report.printers.spoolerStatus) !== 'running' && normalize(report.printers.spoolerStatus) !== 'unavailable') {
    warnings.push({
      id: 'print-spooler-stopped',
      title: 'Print Spooler Stopped',
      severity: 'warning',
      description: `The print spooler service is ${report.printers.spoolerStatus}.`,
      recommendedAction: 'Start the Print Spooler service and verify the default printer can accept a test print.',
    });
  }

  if (disconnectedDrives.length > 0) {
    warnings.push({
      id: 'mapped-drive-disconnected',
      title: 'Mapped Drive Disconnected',
      severity: 'warning',
      description: `Mapped drive ${listMappedDriveLetters(disconnectedDrives)} is disconnected.`,
      recommendedAction: 'Verify VPN or domain connectivity, confirm permissions, and remap the affected drive if the path is valid.',
    });
  }

  if (report.performance.ramUsagePercent > 90) {
    warnings.push({
      id: 'high-ram-usage',
      title: 'High RAM Usage',
      severity: 'warning',
      description: `Memory usage is ${report.performance.ramUsagePercent}%, which may cause slow response or app instability.`,
      recommendedAction: 'Review high-memory processes with the user, close unnecessary apps, and consider rebooting if usage remains high.',
    });
  }

  return warnings;
};
