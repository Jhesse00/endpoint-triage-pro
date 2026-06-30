import type { EndpointTriageReport, TriageWarning } from '../types/triage';
import { generateWarnings } from './warningEngine';

const getPrimaryDrive = (report: EndpointTriageReport) =>
  report.storage.drives.find((drive) => drive.name.toLowerCase().startsWith('c')) ?? report.storage.drives[0];

const getMappedDriveIssueCount = (report: EndpointTriageReport) =>
  report.mappedDrives.filter((drive) => drive.status.toLowerCase().includes('disconnected')).length;

const getApplicationCrashSummary = (report: EndpointTriageReport) => {
  if (report.events.recentApplicationErrors.length === 0) {
    return 'No recent application crashes found.';
  }

  const providers = Array.from(new Set(report.events.recentApplicationErrors.map((event) => event.providerName).filter(Boolean))).slice(0, 3);
  const source = providers.length > 0 ? providers.join(', ') : 'application event logs';
  return `Recent application errors were recorded by ${source}.`;
};

const getFindings = (report: EndpointTriageReport) => {
  const drive = getPrimaryDrive(report);
  const mappedDriveIssueCount = getMappedDriveIssueCount(report);
  const findings = [
    `Device has been online for ${report.uptime.uptimeDays} days.`,
    drive ? `${drive.name} drive has ${drive.freeGB.toFixed(1)} GB free.` : 'Disk free space was not returned by the collector.',
    report.updates.pendingReboot ? 'Pending reboot detected.' : 'No pending reboot detected.',
    getApplicationCrashSummary(report),
    mappedDriveIssueCount > 0 ? `${mappedDriveIssueCount} mapped drive${mappedDriveIssueCount === 1 ? ' is' : 's are'} disconnected.` : 'No disconnected mapped drives found.',
  ];

  if (report.events.failedLoginsLast24h.length > 0) {
    findings.push(`${report.events.failedLoginsLast24h.length} failed login event(s) found in the last 24 hours.`);
  }

  return findings;
};

const getRecommendedActions = (report: EndpointTriageReport, warnings: TriageWarning[]) => {
  const drive = getPrimaryDrive(report);
  const actions: string[] = [];

  if (report.updates.pendingReboot || report.uptime.uptimeDays > 14) {
    actions.push('Restart the device to clear pending update state and refresh services.');
  }

  if (drive && (drive.freeGB < 10 || drive.freePercent < 10)) {
    actions.push(`Free disk space on ${drive.name} drive.`);
  }

  if (report.events.recentApplicationErrors.length > 0) {
    actions.push('Retest the affected application after reboot or repair.');
  }

  if (getMappedDriveIssueCount(report) > 0) {
    actions.push('Verify mapped drive access and confirm VPN or domain connectivity.');
  }

  for (const warning of warnings) {
    if (!actions.includes(warning.recommendedAction)) {
      actions.push(warning.recommendedAction);
    }
  }

  if (actions.length === 0) {
    actions.push('No immediate endpoint remediation is required from triage findings. Continue issue-specific troubleshooting.');
  }

  return actions.slice(0, 5);
};

const getTechnicianSummary = (findings: string[]) => {
  const relevantFindings = findings
    .filter((finding) => !finding.startsWith('No pending') && !finding.startsWith('No recent') && !finding.startsWith('No disconnected'))
    .map((finding) => finding.replace(/\.$/, '').toLowerCase());

  if (relevantFindings.length === 0) {
    return 'Endpoint triage completed. No immediate endpoint health blockers were detected. Continue issue-specific verification with the user.';
  }

  return `Endpoint triage completed. Findings indicate ${relevantFindings.join(', ')}. Recommended remediation and verification steps documented above.`;
};

export const generateTicketNotes = (report: EndpointTriageReport, warnings = generateWarnings(report)) => {
  const findings = getFindings(report);
  const recommendedActions = getRecommendedActions(report, warnings);

  return `Issue:
Endpoint triage scan performed for reported workstation issue.

Findings:
${findings.map((finding) => `- ${finding}`).join('\n')}

Recommended Actions:
${recommendedActions.map((action) => `- ${action}`).join('\n')}

Verification:
Confirm the user can complete their workflow without errors.

Technician Note:
${getTechnicianSummary(findings)}`;
};
