[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$WarningPreference = 'SilentlyContinue'
$InformationPreference = 'SilentlyContinue'

$script:LimitedFields = New-Object 'System.Collections.Generic.List[string]'

function Add-LimitedField {
  param([string]$Name)

  if ([string]::IsNullOrWhiteSpace($Name)) {
    return
  }

  if (-not $script:LimitedFields.Contains($Name)) {
    [void]$script:LimitedFields.Add($Name)
  }
}

function Invoke-Safe {
  param(
    [scriptblock]$ScriptBlock,
    $DefaultValue = $null,
    [string]$LimitedField
  )

  try {
    $value = & $ScriptBlock
    if ($null -eq $value) {
      return $DefaultValue
    }

    return $value
  } catch {
    if (-not [string]::IsNullOrWhiteSpace($LimitedField)) {
      Add-LimitedField $LimitedField
    }

    return $DefaultValue
  }
}

function Convert-ToIsoString {
  param($Value)

  if ($null -eq $Value) {
    return ''
  }

  try {
    if ($Value -is [datetime]) {
      return $Value.ToUniversalTime().ToString('o')
    }

    $parsed = [datetime]::Parse([string]$Value)
    return $parsed.ToUniversalTime().ToString('o')
  } catch {
    return [string]$Value
  }
}

function Convert-BytesToGB {
  param($Bytes)

  try {
    if ($null -eq $Bytes -or [double]$Bytes -le 0) {
      return 0
    }

    return [math]::Round(([double]$Bytes / 1GB), 1)
  } catch {
    return 0
  }
}

function Convert-KBToGB {
  param($Kilobytes)

  try {
    if ($null -eq $Kilobytes -or [double]$Kilobytes -le 0) {
      return 0
    }

    return [math]::Round(([double]$Kilobytes / 1MB), 1)
  } catch {
    return 0
  }
}

function Convert-ToSafeString {
  param(
    $Value,
    [string]$DefaultValue = 'Unavailable'
  )

  if ($null -eq $Value) {
    return $DefaultValue
  }

  $text = [string]$Value
  if ([string]::IsNullOrWhiteSpace($text)) {
    return $DefaultValue
  }

  return $text.Trim()
}

function Convert-InstallDate {
  param($Value)

  $text = Convert-ToSafeString $Value ''
  if ([string]::IsNullOrWhiteSpace($text)) {
    return ''
  }

  try {
    if ($text -match '^\d{8}$') {
      return ([datetime]::ParseExact($text, 'yyyyMMdd', $null)).ToString('yyyy-MM-dd')
    }

    return ([datetime]::Parse($text)).ToString('yyyy-MM-dd')
  } catch {
    return $text
  }
}

function Convert-EventRecord {
  param($Event)

  $message = Convert-ToSafeString $Event.Message ''
  $message = ($message -replace '\s+', ' ').Trim()
  if ($message.Length -gt 700) {
    $message = $message.Substring(0, 700) + '...'
  }

  [ordered]@{
    timeCreated = Convert-ToIsoString $Event.TimeCreated
    providerName = Convert-ToSafeString $Event.ProviderName
    eventId = [int]$Event.Id
    levelDisplayName = Convert-ToSafeString $Event.LevelDisplayName
    message = $message
  }
}

function Convert-NetworkAdapterStatus {
  param($StatusCode)

  switch ([string]$StatusCode) {
    '0' { return 'Disconnected' }
    '1' { return 'Connecting' }
    '2' { return 'Connected' }
    '3' { return 'Disconnecting' }
    '4' { return 'Hardware Not Present' }
    '5' { return 'Hardware Disabled' }
    '6' { return 'Hardware Malfunction' }
    '7' { return 'Media Disconnected' }
    '8' { return 'Authenticating' }
    '9' { return 'Authentication Succeeded' }
    '10' { return 'Authentication Failed' }
    '11' { return 'Invalid Address' }
    '12' { return 'Credentials Required' }
    default { return Convert-ToSafeString $StatusCode 'Unknown' }
  }
}

function Test-IsAdministrator {
  try {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  } catch {
    return $false
  }
}

function Get-ReportId {
  $timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
  $suffix = ([guid]::NewGuid().ToString('N')).Substring(0, 8)
  return "triage-$timestamp-$suffix"
}

function Get-Hostname {
  $name = Convert-ToSafeString $env:COMPUTERNAME ''
  if (-not [string]::IsNullOrWhiteSpace($name)) {
    return $name
  }

  return Invoke-Safe -DefaultValue 'Unavailable' -ScriptBlock { [Environment]::MachineName }
}

function Get-LoggedInUser {
  $identityName = Invoke-Safe -DefaultValue '' -ScriptBlock { [Security.Principal.WindowsIdentity]::GetCurrent().Name }
  if (-not [string]::IsNullOrWhiteSpace($identityName)) {
    return $identityName
  }

  if (-not [string]::IsNullOrWhiteSpace($env:USERDOMAIN) -and -not [string]::IsNullOrWhiteSpace($env:USERNAME)) {
    return "$env:USERDOMAIN\$env:USERNAME"
  }

  return Convert-ToSafeString $env:USERNAME
}

function Get-OperatingSystemInfo {
  $os = Invoke-Safe -DefaultValue $null -LimitedField 'Operating system WMI details' -ScriptBlock {
    Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop
  }

  [ordered]@{
    name = Convert-ToSafeString $os.Caption
    version = Convert-ToSafeString $os.Version
    build = Convert-ToSafeString $os.BuildNumber
    architecture = Convert-ToSafeString $os.OSArchitecture
  }
}

function Get-HardwareInfo {
  $computer = Invoke-Safe -DefaultValue $null -LimitedField 'Computer hardware details' -ScriptBlock {
    Get-CimInstance -ClassName Win32_ComputerSystem -ErrorAction Stop
  }
  $bios = Invoke-Safe -DefaultValue $null -LimitedField 'BIOS serial number' -ScriptBlock {
    Get-CimInstance -ClassName Win32_BIOS -ErrorAction Stop
  }

  [ordered]@{
    manufacturer = Convert-ToSafeString $computer.Manufacturer
    model = Convert-ToSafeString $computer.Model
    serialNumber = Convert-ToSafeString $bios.SerialNumber
  }
}

function Get-UptimeInfo {
  $os = Invoke-Safe -DefaultValue $null -LimitedField 'System uptime' -ScriptBlock {
    Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop
  }

  $lastBoot = $null
  if ($null -ne $os -and $null -ne $os.LastBootUpTime) {
    $lastBoot = [datetime]$os.LastBootUpTime
  }

  $uptimeDays = 0
  if ($null -ne $lastBoot) {
    $uptimeDays = [int][math]::Floor(((Get-Date) - $lastBoot).TotalDays)
  }

  [ordered]@{
    lastBootTime = Convert-ToIsoString $lastBoot
    uptimeDays = $uptimeDays
  }
}

function Get-DomainOrWorkgroup {
  $computer = Invoke-Safe -DefaultValue $null -LimitedField 'Domain or workgroup membership' -ScriptBlock {
    Get-CimInstance -ClassName Win32_ComputerSystem -ErrorAction Stop
  }

  if ($null -eq $computer) {
    return 'Unavailable'
  }

  if ($computer.PartOfDomain) {
    return Convert-ToSafeString $computer.Domain
  }

  return Convert-ToSafeString $computer.Workgroup
}

function Get-NetworkInfo {
  $adapterDetails = @{}
  $adapterConfig = Invoke-Safe -DefaultValue @() -LimitedField 'Network adapter IP configuration' -ScriptBlock {
    @(Get-CimInstance -ClassName Win32_NetworkAdapterConfiguration -Filter 'IPEnabled=True' -ErrorAction Stop)
  }

  foreach ($config in $adapterConfig) {
    if ($null -ne $config.InterfaceIndex) {
      $adapterDetails[[int]$config.InterfaceIndex] = $config
    }
  }

  $networkAdapters = Invoke-Safe -DefaultValue @() -LimitedField 'Network adapter inventory' -ScriptBlock {
    @(Get-CimInstance -ClassName Win32_NetworkAdapter -ErrorAction Stop | Where-Object { $_.PhysicalAdapter -eq $true })
  }

  $adapters = @()
  foreach ($adapter in $networkAdapters) {
    $config = $adapterDetails[[int]$adapter.InterfaceIndex]
    $ips = @()
    $dns = @()

    if ($null -ne $config) {
      $ips = @($config.IPAddress | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
      $dns = @($config.DNSServerSearchOrder | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    }

    $adapters += [ordered]@{
      name = Convert-ToSafeString $adapter.Name
      status = Convert-NetworkAdapterStatus $adapter.NetConnectionStatus
      macAddress = Convert-ToSafeString $adapter.MACAddress
      ipAddresses = @($ips)
      dnsServers = @($dns)
    }
  }

  $allIps = @($adapterConfig | ForEach-Object { $_.IPAddress } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
  $allDns = @($adapterConfig | ForEach-Object { $_.DNSServerSearchOrder } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)

  $gateway = Invoke-Safe -DefaultValue 'Unavailable' -LimitedField 'Default gateway' -ScriptBlock {
    $gateways = @($adapterConfig | ForEach-Object { $_.DefaultIPGateway } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
    if ($gateways.Count -gt 0) {
      return [string]$gateways[0]
    }

    return 'Unavailable'
  }

  [ordered]@{
    ipAddresses = @($allIps)
    dnsServers = @($allDns)
    defaultGateway = Convert-ToSafeString $gateway
    domainOrWorkgroup = Get-DomainOrWorkgroup
    adapters = @($adapters)
  }
}

function Get-StorageInfo {
  $disks = Invoke-Safe -DefaultValue @() -LimitedField 'Logical disk inventory' -ScriptBlock {
    @(Get-CimInstance -ClassName Win32_LogicalDisk -Filter 'DriveType=3' -ErrorAction Stop)
  }

  $drives = @()
  foreach ($disk in $disks) {
    $totalGB = Convert-BytesToGB $disk.Size
    $freeGB = Convert-BytesToGB $disk.FreeSpace
    $freePercent = 0

    if ($totalGB -gt 0) {
      $freePercent = [math]::Round((([double]$freeGB / [double]$totalGB) * 100), 1)
    }

    $drives += [ordered]@{
      name = Convert-ToSafeString $disk.DeviceID
      fileSystem = Convert-ToSafeString $disk.FileSystem
      totalGB = $totalGB
      freeGB = $freeGB
      freePercent = $freePercent
    }
  }

  [ordered]@{
    drives = @($drives)
  }
}

function Get-PerformanceInfo {
  $os = Invoke-Safe -DefaultValue $null -LimitedField 'Memory usage' -ScriptBlock {
    Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop
  }
  $processors = Invoke-Safe -DefaultValue @() -LimitedField 'CPU information' -ScriptBlock {
    @(Get-CimInstance -ClassName Win32_Processor -ErrorAction Stop)
  }

  $cpuName = 'Unavailable'
  $cpuLoad = $null
  if ($processors.Count -gt 0) {
    $cpuName = Convert-ToSafeString $processors[0].Name
    $loadValues = @($processors | Where-Object { $null -ne $_.LoadPercentage } | ForEach-Object { [double]$_.LoadPercentage })
    if ($loadValues.Count -gt 0) {
      $cpuLoad = [math]::Round((($loadValues | Measure-Object -Average).Average), 1)
    }
  }

  $ramTotalGB = 0
  $ramUsedGB = 0
  $ramUsagePercent = 0
  if ($null -ne $os) {
    $ramTotalGB = Convert-KBToGB $os.TotalVisibleMemorySize
    $ramFreeGB = Convert-KBToGB $os.FreePhysicalMemory
    $ramUsedGB = [math]::Max(0, [math]::Round(($ramTotalGB - $ramFreeGB), 1))
    if ($ramTotalGB -gt 0) {
      $ramUsagePercent = [math]::Round((($ramUsedGB / $ramTotalGB) * 100), 1)
    }
  }

  [ordered]@{
    cpuName = $cpuName
    cpuLoadPercent = $cpuLoad
    ramTotalGB = $ramTotalGB
    ramUsedGB = $ramUsedGB
    ramUsagePercent = $ramUsagePercent
  }
}

function Test-PendingReboot {
  $pending = $false

  $registryChecks = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending',
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired',
    'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager'
  )

  foreach ($path in $registryChecks) {
    try {
      if ($path -like '*Session Manager') {
        $sessionManager = Get-ItemProperty -Path $path -Name PendingFileRenameOperations -ErrorAction SilentlyContinue
        if ($null -ne $sessionManager.PendingFileRenameOperations) {
          $pending = $true
        }
      } elseif (Test-Path -Path $path -ErrorAction SilentlyContinue) {
        $pending = $true
      }
    } catch {
      Add-LimitedField 'Pending reboot registry checks'
    }
  }

  try {
    $computerName = Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\ComputerName\ComputerName' -ErrorAction Stop
    $activeName = Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\ComputerName\ActiveComputerName' -ErrorAction Stop
    if ($computerName.ComputerName -ne $activeName.ComputerName) {
      $pending = $true
    }
  } catch {
    Add-LimitedField 'Computer rename pending reboot check'
  }

  return [bool]$pending
}

function Get-Hotfixes {
  $hotfixes = Invoke-Safe -DefaultValue @() -LimitedField 'Recent hotfixes' -ScriptBlock {
    @(Get-HotFix -ErrorAction Stop | Sort-Object -Property InstalledOn -Descending | Select-Object -First 10)
  }

  $result = @()
  foreach ($hotfix in $hotfixes) {
    $result += [ordered]@{
      hotfixId = Convert-ToSafeString $hotfix.HotFixID
      installedOn = Convert-InstallDate $hotfix.InstalledOn
      description = Convert-ToSafeString $hotfix.Description
    }
  }

  return @($result)
}

function Get-BitLockerStatus {
  if ($null -eq (Get-Command -Name Get-BitLockerVolume -ErrorAction SilentlyContinue)) {
    Add-LimitedField 'BitLocker status'
    return 'Unavailable'
  }

  $volume = Invoke-Safe -DefaultValue $null -LimitedField 'BitLocker status' -ScriptBlock {
    Get-BitLockerVolume -MountPoint $env:SystemDrive -ErrorAction Stop
  }

  if ($null -eq $volume) {
    return 'Unavailable'
  }

  $protectionStatus = Convert-ToSafeString $volume.ProtectionStatus 'Unknown'
  if ($protectionStatus -eq 'On' -or $protectionStatus -eq '1' -or $protectionStatus -eq 'Enabled') {
    return 'Enabled'
  }

  if ($protectionStatus -eq 'Off' -or $protectionStatus -eq '0' -or $protectionStatus -eq 'Disabled') {
    return 'Disabled'
  }

  return $protectionStatus
}

function Get-DefenderStatus {
  if ($null -eq (Get-Command -Name Get-MpComputerStatus -ErrorAction SilentlyContinue)) {
    Add-LimitedField 'Windows Defender status'
    return 'Unavailable'
  }

  $defender = Invoke-Safe -DefaultValue $null -LimitedField 'Windows Defender status' -ScriptBlock {
    Get-MpComputerStatus -ErrorAction Stop
  }

  if ($null -eq $defender) {
    return 'Unavailable'
  }

  if ($defender.AMServiceEnabled -and $defender.AntivirusEnabled -and $defender.RealTimeProtectionEnabled) {
    return 'Enabled'
  }

  return 'Disabled'
}

function Get-FirewallProfiles {
  if ($null -eq (Get-Command -Name Get-NetFirewallProfile -ErrorAction SilentlyContinue)) {
    Add-LimitedField 'Firewall profile status'
    return @()
  }

  $profiles = Invoke-Safe -DefaultValue @() -LimitedField 'Firewall profile status' -ScriptBlock {
    @(Get-NetFirewallProfile -ErrorAction Stop)
  }

  $result = @()
  foreach ($profile in $profiles) {
    $result += [ordered]@{
      name = Convert-ToSafeString $profile.Name
      enabled = [bool]$profile.Enabled
    }
  }

  return @($result)
}

function Get-LocalAdministrators {
  $admins = @()

  if ($null -ne (Get-Command -Name Get-LocalGroupMember -ErrorAction SilentlyContinue)) {
    $admins = Invoke-Safe -DefaultValue @() -LimitedField 'Local administrators' -ScriptBlock {
      @(Get-LocalGroupMember -Group 'Administrators' -ErrorAction Stop | ForEach-Object { $_.Name })
    }
  }

  if ($admins.Count -eq 0) {
    $admins = Invoke-Safe -DefaultValue @() -LimitedField 'Local administrators' -ScriptBlock {
      $group = [ADSI]'WinNT://./Administrators,group'
      @($group.Invoke('Members') | ForEach-Object {
        $member = $_.GetType().InvokeMember('Name', 'GetProperty', $null, $_, $null)
        [string]$member
      })
    }
  }

  return @($admins | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Sort-Object -Unique)
}

function Get-SecurityInfo {
  [ordered]@{
    bitlockerStatus = Get-BitLockerStatus
    defenderStatus = Get-DefenderStatus
    firewallProfiles = @(Get-FirewallProfiles)
    localAdmins = @(Get-LocalAdministrators)
  }
}

function Get-EventRecords {
  param(
    [string]$LogName,
    [int[]]$Ids,
    [int[]]$Levels,
    [datetime]$StartTime,
    [int]$MaxEvents = 20,
    [string]$LimitedField
  )

  $filter = @{
    LogName = $LogName
    StartTime = $StartTime
  }

  if ($null -ne $Ids -and $Ids.Count -gt 0) {
    $filter['Id'] = $Ids
  }

  if ($null -ne $Levels -and $Levels.Count -gt 0) {
    $filter['Level'] = $Levels
  }

  $events = try {
    @(Get-WinEvent -FilterHashtable $filter -MaxEvents $MaxEvents -ErrorAction Stop)
  } catch {
    $message = Convert-ToSafeString $_.Exception.Message ''
    if ($message -notmatch 'No events were found') {
      Add-LimitedField $LimitedField
    }

    @()
  }

  $result = @()
  foreach ($event in $events) {
    $result += Convert-EventRecord $event
  }

  return @($result)
}

function Get-EventsInfo {
  [ordered]@{
    failedLoginsLast24h = @(Get-EventRecords -LogName 'Security' -Ids @(4625) -StartTime (Get-Date).AddHours(-24) -MaxEvents 20 -LimitedField 'Failed login security events')
    recentSystemErrors = @(Get-EventRecords -LogName 'System' -Levels @(1, 2) -StartTime (Get-Date).AddDays(-7) -MaxEvents 20 -LimitedField 'Recent system error events')
    recentApplicationErrors = @(Get-EventRecords -LogName 'Application' -Levels @(1, 2) -StartTime (Get-Date).AddDays(-7) -MaxEvents 20 -LimitedField 'Recent application error events')
  }
}

function Get-PrinterStatusName {
  param($Printer)

  $status = Convert-ToSafeString $Printer.Status ''
  if (-not [string]::IsNullOrWhiteSpace($status)) {
    return $status
  }

  if ($Printer.WorkOffline) {
    return 'Offline'
  }

  return 'Unknown'
}

function Get-PrintersInfo {
  $spoolerStatus = Invoke-Safe -DefaultValue 'Unavailable' -LimitedField 'Print spooler status' -ScriptBlock {
    (Get-Service -Name Spooler -ErrorAction Stop).Status.ToString()
  }

  $printers = Invoke-Safe -DefaultValue @() -LimitedField 'Installed printers' -ScriptBlock {
    @(Get-CimInstance -ClassName Win32_Printer -ErrorAction Stop)
  }

  $installedPrinters = @()
  foreach ($printer in $printers) {
    $installedPrinters += [ordered]@{
      name = Convert-ToSafeString $printer.Name
      isDefault = [bool]$printer.Default
      status = Get-PrinterStatusName $printer
    }
  }

  [ordered]@{
    spoolerStatus = Convert-ToSafeString $spoolerStatus
    installedPrinters = @($installedPrinters)
  }
}

function Get-MappedDrives {
  $disks = Invoke-Safe -DefaultValue @() -LimitedField 'Mapped drives' -ScriptBlock {
    @(Get-CimInstance -ClassName Win32_LogicalDisk -Filter 'DriveType=4' -ErrorAction Stop)
  }

  $result = @()
  foreach ($disk in $disks) {
    $status = Convert-ToSafeString $disk.Status 'Unknown'
    $driveLetter = Convert-ToSafeString $disk.DeviceID

    try {
      if (-not (Test-Path -Path ($driveLetter + '\') -ErrorAction SilentlyContinue)) {
        $status = 'Disconnected'
      } elseif ($status -eq 'Unavailable' -or $status -eq 'Unknown') {
        $status = 'OK'
      }
    } catch {
      $status = 'Unknown'
    }

    $result += [ordered]@{
      driveLetter = $driveLetter
      remotePath = Convert-ToSafeString $disk.ProviderName
      status = $status
    }
  }

  return @($result)
}

function Get-InstalledApps {
  $registryPaths = @(
    'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*'
  )

  $apps = @()
  foreach ($path in $registryPaths) {
    if (-not (Test-Path -Path $path -ErrorAction SilentlyContinue)) {
      continue
    }

    $items = Invoke-Safe -DefaultValue @() -LimitedField 'Installed applications' -ScriptBlock {
      @(Get-ItemProperty -Path $path -ErrorAction Stop)
    }

    foreach ($item in $items) {
      $name = Convert-ToSafeString $item.DisplayName ''
      if ([string]::IsNullOrWhiteSpace($name)) {
        continue
      }

      if ($item.SystemComponent -eq 1) {
        continue
      }

      $apps += [ordered]@{
        name = $name
        version = Convert-ToSafeString $item.DisplayVersion ''
        publisher = Convert-ToSafeString $item.Publisher ''
        installDate = Convert-InstallDate $item.InstallDate
      }
    }
  }

  $seen = @{}
  $result = @()
  foreach ($app in ($apps | Sort-Object -Property name, version, publisher)) {
    $key = (($app.name + '|' + $app.version + '|' + $app.publisher).ToLowerInvariant())
    if (-not $seen.ContainsKey($key)) {
      $seen[$key] = $true
      $result += $app
    }
  }

  return @($result)
}

function New-FallbackReport {
  param(
    [bool]$IsAdmin,
    [string]$FatalMessage
  )

  Add-LimitedField 'Collector fatal fallback'
  if (-not [string]::IsNullOrWhiteSpace($FatalMessage)) {
    Add-LimitedField $FatalMessage
  }

  $report = [ordered]@{}
  if (-not $IsAdmin) {
    $report['status'] = 'PermissionRequired'
    $report['message'] = 'Run as administrator for full results.'
  }

  $report['reportId'] = Get-ReportId
  $report['scanTime'] = (Get-Date).ToUniversalTime().ToString('o')
  $report['hostname'] = Get-Hostname
  $report['loggedInUser'] = Get-LoggedInUser
  $report['os'] = [ordered]@{ name = 'Unavailable'; version = 'Unavailable'; build = 'Unavailable'; architecture = 'Unavailable' }
  $report['hardware'] = [ordered]@{ manufacturer = 'Unavailable'; model = 'Unavailable'; serialNumber = 'Unavailable' }
  $report['uptime'] = [ordered]@{ lastBootTime = ''; uptimeDays = 0 }
  $report['network'] = [ordered]@{ ipAddresses = @(); dnsServers = @(); defaultGateway = 'Unavailable'; domainOrWorkgroup = 'Unavailable'; adapters = @() }
  $report['storage'] = [ordered]@{ drives = @() }
  $report['performance'] = [ordered]@{ cpuName = 'Unavailable'; cpuLoadPercent = $null; ramTotalGB = 0; ramUsedGB = 0; ramUsagePercent = 0 }
  $report['security'] = [ordered]@{ bitlockerStatus = 'Unavailable'; defenderStatus = 'Unavailable'; firewallProfiles = @(); localAdmins = @() }
  $report['updates'] = [ordered]@{ pendingReboot = $false; lastHotfixes = @() }
  $report['events'] = [ordered]@{ failedLoginsLast24h = @(); recentSystemErrors = @(); recentApplicationErrors = @() }
  $report['printers'] = [ordered]@{ spoolerStatus = 'Unavailable'; installedPrinters = @() }
  $report['mappedDrives'] = @()
  $report['installedApps'] = @()
  $report['permissions'] = [ordered]@{ isAdmin = $IsAdmin; limitedFields = @($script:LimitedFields) }

  return $report
}

function New-EndpointTriageReport {
  $isAdmin = Test-IsAdministrator

  if (-not $isAdmin) {
    Add-LimitedField 'Full security log detail'
    Add-LimitedField 'BitLocker protector inventory'
  }

  $report = [ordered]@{}
  if (-not $isAdmin) {
    $report['status'] = 'PermissionRequired'
    $report['message'] = 'Run as administrator for full results.'
  }

  $report['reportId'] = Get-ReportId
  $report['scanTime'] = (Get-Date).ToUniversalTime().ToString('o')
  $report['hostname'] = Get-Hostname
  $report['loggedInUser'] = Get-LoggedInUser
  $report['os'] = Get-OperatingSystemInfo
  $report['hardware'] = Get-HardwareInfo
  $report['uptime'] = Get-UptimeInfo
  $report['network'] = Get-NetworkInfo
  $report['storage'] = Get-StorageInfo
  $report['performance'] = Get-PerformanceInfo
  $report['security'] = Get-SecurityInfo
  $report['updates'] = [ordered]@{
    pendingReboot = Test-PendingReboot
    lastHotfixes = @(Get-Hotfixes)
  }
  $report['events'] = Get-EventsInfo
  $report['printers'] = Get-PrintersInfo
  $report['mappedDrives'] = @(Get-MappedDrives)
  $report['installedApps'] = @(Get-InstalledApps)
  $report['permissions'] = [ordered]@{
    isAdmin = $isAdmin
    limitedFields = @($script:LimitedFields | Sort-Object -Unique)
  }

  return $report
}

try {
  $result = New-EndpointTriageReport
  $result | ConvertTo-Json -Depth 10
} catch {
  $fallback = New-FallbackReport -IsAdmin (Test-IsAdministrator) -FatalMessage 'Collector encountered an unexpected error'
  $fallback | ConvertTo-Json -Depth 10
}
