Add-Type -AssemblyName System.Drawing
$src = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\markly-next\public\icon-512.png"
$root = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\markly-next"
$extIcons = Join-Path $root "markly-extension\icons"
$favicon = Join-Path $root "public\favicon.png"

if (!(Test-Path $extIcons)) { New-Item -ItemType Directory -Path $extIcons -Force }

$img = [System.Drawing.Image]::FromFile($src)
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, 0, 0)
$img.Dispose()

# Simple transparency: make white transparent
$bmp.MakeTransparent([System.Drawing.Color]::White)

function SaveIcon($size, $path) {
    $newBmp = New-Object System.Drawing.Bitmap($size, $size)
    $newG = [System.Drawing.Graphics]::FromImage($newBmp)
    $newG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $newG.DrawImage($bmp, 0, 0, $size, $size)
    $newBmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $newG.Dispose()
    $newBmp.Dispose()
    Write-Host "Created: $path"
}

SaveIcon 16 (Join-Path $extIcons "icon16.png")
SaveIcon 48 (Join-Path $extIcons "icon48.png")
SaveIcon 128 (Join-Path $extIcons "icon128.png")
SaveIcon 32 $favicon

$bmp.Dispose()
$g.Dispose()
Write-Host "Icon generation complete."
