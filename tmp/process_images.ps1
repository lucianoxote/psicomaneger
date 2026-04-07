
Add-Type -AssemblyName System.Drawing
function Remove-WhiteBackground {
    param([string]$sourcePath, [string]$targetPath)
    
    $img = [System.Drawing.Bitmap]::FromFile($sourcePath)
    $newImg = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
    
    for ($y = 0; $y -lt $img.Height; $y++) {
        for ($x = 0; $x -lt $img.Width; $x++) {
            $pixel = $img.GetPixel($x, $y)
            # Threshold for "whitish" pixels
            if ($pixel.R -gt 240 -and $pixel.G -gt 240 -and $pixel.B -gt 240) {
                $newImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } else {
                $newImg.SetPixel($x, $y, $pixel)
            }
        }
    }
    
    $newImg.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    $newImg.Dispose()
}

# Process Logo
Remove-WhiteBackground "c:\Users\Luciano Peixoto\Desktop\psico-manager\public\images\logo_livia.jpg" "c:\Users\Luciano Peixoto\Desktop\psico-manager\public\images\logo_livia_transparent.png"
# Process Brain Favicon
Remove-WhiteBackground "c:\Users\Luciano Peixoto\Desktop\psico-manager\public\images\brain_icon_raw.jpg" "c:\Users\Luciano Peixoto\Desktop\psico-manager\public\favicon.png"
