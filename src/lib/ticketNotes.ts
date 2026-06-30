import type { EndpointTriageReport, TriageWarning } from '../types/triage';
import { generateWarnings } from './warningEngine';

const yesNo = (value: boolean) => (value ? 'Yes' : 'No');

const getDiskStatus = (report: EndpointTriageReport) => {
  const lowDrives = report.storage.drives.filter((drive) => drive.freeGB < 10 || drive.freePercent < 10);
  if (lowDrives.length === 0) {
    return 'No low disk space detected';
  }

  return lowDrives.map((drive) => `${drive.name} low space, ${drive.freeGB.toFixed(1)} GB free (${drive.freePercent.toFixed(1)}%)`).join('; ');
};

const getPrinterStatus = (report: EndpointTriageReport) => {
  const defaultPrinter = report.printers.installedPrinters.find((printer) => printer.isDefault);
  if (!defaultPrinter) {
    return `Spooler ${report.printers.spoolerStatus.toLowerCase()}, no default printer found`;
  }

  return `Spooler ${report.printers.spoolerStatus.toLowerCase()}, default printer ${defaultPrinter.name} ${defaultPrinter.status.toLowerCase()}`;
};

const getMappedDriveIssueCount = (report: EndpointTriageReport) =>
  report.mappedDrives.filter((drive) => drive.status.toLowerCase().includes('disconnected')).length;

const getRecentErrorCount = (report: EndpointTriageReport) => report.events.recentSystemErrors.length + report.events.recentApplicationErrors.length;

const getRecommendedActions = (warnings: TriageWarning[]) => {
  const actions = warnings.map((warning) => warning.recommendedAction);
  const uniqueActions = Array.from(new Set(actions));

  if (uniqueActions.length >= 3) {
    return uniqueActions.slice(0, 3);
  }

  return [
    ...uniqueActions,
    'Restart the endpoint if updates, policy refresh, or resource pressure may be contributing to the issue.',
    'Re-run endpoint triage after remediation to confirm the health score and warnings improve.',
    'Escalate unresolved security, storage, or recurring event log findings to the appropriate support queue.',
  ].slice(0, 3);
};

const getFinalFindingsSummary = (warnings: TriageWarning[]) => {
  if (warnings.length === 0) {
    return 'no immediate critical warnings';
  }

  return warnings.slice(0, 5).map((warning) => warning.title.toLowerCase()).join(', ');
};

export const generateTicketNotes = (report: EndpointTriageReport, warnings = generateWarnings(report)) => {
  const recentErrorCount = getRecentErrorCount(report);
  const failedLoginCount = report.events.failedLoginsLast24h.length;
  const mappedDriveIssueCount = getMappedDriveIssueCount(report);
  const recommendedActions = getRecommendedActions(warnings);
  const finalFindings = getFinalFindingsSummary(warnings);

  return `Issue:
Endpoint triage scan performed for reported device issue.

Findings:
- Device: ${report.hostname}
- User: ${report.loggedInUser}
- Uptime: ${report.uptime.uptimeDays} days
- Disk status: ${getDiskStatus(report)}
- Pending reboot: ${yesNo(report.updates.pendingReboot)}
- Recent errors: ${recentErrorCount} found
- Failed logins: ${failedLoginCount} found
- Mapped drive issues: ${mappedDriveIssueCount} found
- Printer status: ${getPrinterStatus(report)}

Recommended Actions:
${recommendedActions.map((action) => `- ${action}`).join('\n')}

Verification Steps:
- Confirm user can reproduce or no longer reproduce the issue.
- Confirm affected app/service works normally.
- Confirm no immediate recurring errors appear.

Final Ticket Note:
Performed endpoint triage on ${report.hostname} for ${report.loggedInUser}. Findings included ${finalFindings}. Recommended follow-up actions were documented above and should be verified with the user after remediation.`;
};
