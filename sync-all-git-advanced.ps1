<#
PowerShell Script: Recursively sync all Git repositories, with scheduled execution, logging, and email notification.
1. Recursively find all Git repositories in subdirectories
2. Automatically pull/push all branches
3. Log all actions
4. Can be used with Task Scheduler
5. Email notification (requires SMTP configuration)
#>


param(
    [string]$LogFile = "sync-all-git.log",
    [string]$MailTo = "",
    [string]$MailFrom = "",
    [string]$SmtpServer = ""
)

function Write-Log {
    param([string]$msg)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] $msg"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}


$ErrorActionPreference = "Continue"
$hasError = $false

Get-ChildItem -Recurse -Directory | ForEach-Object {
    $repo = $_.FullName
    if (Test-Path "$repo/.git") {
        Write-Log "==== $repo ===="
        Set-Location $repo
        try {
            Write-Log "Pulling remote updates..."
            git fetch --all | Out-Null
            git branch -r | ForEach-Object {
                $remoteBranch = $_.Trim()
                if ($remoteBranch -match 'origin/(.+)') {
                    $branch = $Matches[1]
                    git checkout $branch 2>$null
                    git pull origin $branch
                    Write-Log "Synced branch: $branch"
                }
            }
            Write-Log "Pushing local changes..."
            git add .
            git commit -am "sync: auto sync local changes" 2>$null
            git branch | ForEach-Object {
                $localBranch = $_.Trim().Replace('* ','')
                git push origin $localBranch
            }
        } catch {
            Write-Log "Sync failed: $_"
            $hasError = $true
        }
        Set-Location -Path $PSScriptRoot
    }
}

if ($MailTo -and $MailFrom -and $SmtpServer) {
    $subject = if ($hasError) { "[Git Sync] Some failed" } else { "[Git Sync] All succeeded" }
    $body = Get-Content $LogFile | Out-String
    try {
        Send-MailMessage -To $MailTo -From $MailFrom -SmtpServer $SmtpServer -Subject $subject -Body $body
        Write-Log "Email notification sent."
    } catch {
        Write-Log "Email sending failed: $_"
    }
}
