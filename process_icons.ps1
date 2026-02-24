Add-Type -AssemblyName System.Drawing
$srcPath = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\markly-next\public\icon-512.png"
$destDir = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\markly-next\markly-extension\icons"
$faviconPath = "e:\Workspace-Projects\Smart Bookmark Manager\smart-bookmark-hub-main\markly-next\public\favicon.png"

if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir }

$img = [System.Drawing.Image]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, 0, 0)
$img.Dispose()

# Procedurally remove white background with tolerance for anti-aliasing
for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        # If color is near white (R,G,B > 240)
        if ($c.R -gt 240 -and $c.G -gt 240 -and $c.B -gt 240) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $c.R, $c.G, $c.B))
        }
    }
}

function Resize-And-Save($w, $h, $path) {
    $res = New-Object System.Drawing.Bitmap($w, $h)
    $rg = [System.Drawing.Graphics]::FromImage($res)
    $rg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $rg.DrawImage($bmp, 0, 0, $w, $h)
    $res.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $rg.Dispose()
    $res.Dispose()
}

Write-Host "Generating icons..."
Resize-And-Save 16 16 "$destDir\icon16.png"
Resize-And-Save 48 48 "$destDir\icon48.png"
Resize-And-Save 128 128 "$destDir\icon128.png"
Resize-And-Save 32 32 $faviconPath

$bmp.Dispose()
$g.Dispose()
Write-Host "Done!"
