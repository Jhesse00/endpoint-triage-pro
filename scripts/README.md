# Endpoint Triage Collector

Phase 2 adds `Invoke-EndpointTriage.ps1`, a local Windows PowerShell collector for Endpoint Triage Pro.

Run from the project root on a Windows endpoint:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-EndpointTriage.ps1
```

Save a test report locally:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-EndpointTriage.ps1 > .\reports\sample-report.json
```

Validate that the output is parseable JSON:

```powershell
$report = Get-Content .\reports\sample-report.json -Raw | ConvertFrom-Json
$report.hostname
$report.permissions
```

Run PowerShell as administrator for full event log, BitLocker, and security-related results. When not elevated, the script still returns available diagnostic data and includes `status: "PermissionRequired"`, `message: "Run as administrator for full results."`, and `permissions.limitedFields`.

The collector outputs JSON only and does not collect passwords, browser history, files, documents, tokens, cookies, or clipboard data.
