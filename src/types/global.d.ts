import type { EndpointTriageReport } from './triage';

declare global {
  interface Window {
    endpointTriage?: {
      runScan: () => Promise<EndpointTriageReport>;
      getReports: () => Promise<EndpointTriageReport[]>;
      exportJson: (reportId: string) => Promise<void>;
      exportHtml: (reportId: string) => Promise<void>;
      openReportsFolder: () => Promise<void>;
    };
  }
}

export {};
