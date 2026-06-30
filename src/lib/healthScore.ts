import type { EndpointTriageReport } from '../types/triage';

export type HealthLabel = 'Healthy' | 'Good' | 'Needs Attention' | 'Poor' | 'Critical';

export interface HealthScoreResult {
  score: number;
  label: HealthLabel;
}

const clampScore = (score: number) => Math.max(0, Math.min(100, score));

const normalize = (value: string) => value.trim().toLowerCase();

const isDisabledStatus = (value: string) => {
  const status = normalize(value);
  return status === 'off' || status === 'disabled' || status.includes('disabled');
};

const hasRecentCriticalSystemErrors = (report: EndpointTriageReport) =>
  report.events.recentSystemErrors.some((event) => normalize(event.levelDisplayName) === 'critical');

const hasDisconnectedMappedDrives = (report: EndpointTriageReport) =>
  report.mappedDrives.some((drive) => normalize(drive.status).includes('disconnected'));

const isPrintSpoolerStopped = (report: EndpointTriageReport) => {
  const status = normalize(report.printers.spoolerStatus);
  return status !== '' && status !== 'running' && status !== 'unavailable';
};

export const getHealthLabel = (score: number): HealthLabel => {
  if (score >= 90) return 'Healthy';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Needs Attention';
  if (score >= 40) return 'Poor';
  return 'Critical';
};

export const calculateHealthScore = (report: EndpointTriageReport): HealthScoreResult => {
  let score = 100;

  if (report.uptime.uptimeDays > 14) score -= 8;
  if (report.storage.drives.some((drive) => drive.freeGB < 10)) score -= 15;
  if (report.storage.drives.some((drive) => drive.freePercent < 10)) score -= 15;
  if (report.updates.pendingReboot) score -= 10;
  if (isDisabledStatus(report.security.bitlockerStatus)) score -= 15;
  if (isDisabledStatus(report.security.defenderStatus)) score -= 20;
  if (report.security.firewallProfiles.some((profile) => !profile.enabled)) score -= 15;
  if (report.events.failedLoginsLast24h.length > 0) score -= 8;
  if (hasRecentCriticalSystemErrors(report)) score -= 15;
  if (report.events.recentApplicationErrors.length > 0) score -= 10;
  if (hasDisconnectedMappedDrives(report)) score -= 8;
  if (isPrintSpoolerStopped(report)) score -= 8;
  if (report.performance.ramUsagePercent > 90) score -= 10;

  const clampedScore = clampScore(score);

  return {
    score: clampedScore,
    label: getHealthLabel(clampedScore),
  };
};
