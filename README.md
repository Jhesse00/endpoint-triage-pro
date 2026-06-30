# Endpoint Triage Pro

Endpoint Triage Pro is a Windows Electron desktop app for help desk endpoint diagnostics. It runs a local PowerShell collector, stores reports locally, calculates endpoint health, generates warning cards, creates ticket notes, and exports JSON/HTML reports.

## Development

Install dependencies:

```bash
npm install
```

Run the desktop app in development:

```bash
npm run electron:dev
```

Run the renderer only:

```bash
npm run dev
```

## Verification

```bash
npm run typecheck
npm run build:all
```

## Windows Collector Test

Run this from the project root on a Windows endpoint:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-EndpointTriage.ps1
```

Save a local test report:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-EndpointTriage.ps1 > .\reports\sample-report.json
```

Validate JSON:

```powershell
$report = Get-Content .\reports\sample-report.json -Raw | ConvertFrom-Json
$report.hostname
$report.permissions
```

## Packaging

Build the app:

```bash
npm run build:all
```

Build Windows installer and portable targets on Windows:

```bash
npm run dist:win
```

The packaged Windows executable is configured as `EndpointTriagePro.exe`. Reports are written to the local Electron user data folder in packaged builds, not bundled into installers.

## Privacy

Endpoint Triage Pro collects local device diagnostic data only. Reports stay on the machine unless a technician manually exports or shares them. The collector does not collect passwords, files, browser history, documents, tokens, cookies, or clipboard data.
