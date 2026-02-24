# Copy all remaining shadcn/ui components from the original project
$src = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\src\components\ui"
$dst = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\markly-next\src\components\ui"

# Ensure dest exists
New-Item -ItemType Directory -Force -Path $dst | Out-Null

Get-ChildItem -Path $src -File | ForEach-Object {
    $destFile = Join-Path $dst $_.Name
    if (-not (Test-Path $destFile)) {
        Copy-Item $_.FullName $destFile
        Write-Host "Copied: $($_.Name)"
    } else {
        Write-Host "Skipped (exists): $($_.Name)"
    }
}

# Copy dashboard components
$srcDash = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\src\components\dashboard"
$dstDash = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\markly-next\src\components\dashboard"
New-Item -ItemType Directory -Force -Path $dstDash | Out-Null

Get-ChildItem -Path $srcDash -File | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $dstDash $_.Name) -Force
    Write-Host "Copied dashboard: $($_.Name)"
}

# Copy landing components
$srcLand = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\src\components\landing"
$dstLand = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\markly-next\src\components\landing"
New-Item -ItemType Directory -Force -Path $dstLand | Out-Null

Get-ChildItem -Path $srcLand -File | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $dstLand $_.Name) -Force
    Write-Host "Copied landing: $($_.Name)"
}

# Copy other components
$srcOther = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\src\components"
$dstOther = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\markly-next\src\components"

Get-ChildItem -Path $srcOther -File | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $dstOther $_.Name) -Force
    Write-Host "Copied component: $($_.Name)"
}

# Copy existing hooks
$srcHooks = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\src\hooks"
$dstHooks = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\markly-next\src\hooks"

Get-ChildItem -Path $srcHooks -File | ForEach-Object {
    $destFile = Join-Path $dstHooks $_.Name
    if (-not (Test-Path $destFile)) {
        Copy-Item $_.FullName $destFile
        Write-Host "Copied hook: $($_.Name)"
    }
}

Write-Host "`nDone!"
