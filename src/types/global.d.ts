import type { EndpointTriageReport, RunScanResult } from './triage';

declare global {
  interface Window {
    endpointTriage?: {
      runScan: () => Promise<RunScanResult>;
      cancelScan: () => Promise<void>;
      getReports: () => Promise<EndpointTriageReport[]>;
      exportJson: (reportId: string) => Promise<void>;
      exportHtml: (reportId: string) => Promise<void>;
      openJson: (reportId: string) => Promise<void>;
      openReportsFolder: () => Promise<void>;
    };
  }
}

export {};
