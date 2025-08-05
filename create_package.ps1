# Chrome Web Store Package Creator
# This script creates a ZIP file with only the necessary files for Chrome Web Store submission

$extensionFiles = @(
    "manifest.json",
    "background.js", 
    "content.js",
    "popup.html",
    "popup.js",
    "icon16.png",
    "icon32.png", 
    "icon48.png",
    "icon128.png",
    "mute.svg",
    "next.svg",
    "pause.svg", 
    "play.svg",
    "prev.svg",
    "unmute.svg",
    "RewindBack.svg",
    "RewindForward.svg",
    "ThumbnailPoster.png"
)

$zipFileName = "music_controller_v1.1.zip"
$tempFolder = "temp_extension_package"

Write-Host "Creating Chrome Web Store package..." -ForegroundColor Green

# Create temporary folder
if (Test-Path $tempFolder) {
    Remove-Item $tempFolder -Recurse -Force
}
New-Item -ItemType Directory -Name $tempFolder | Out-Null

# Copy required files to temp folder
foreach ($file in $extensionFiles) {
    if (Test-Path $file) {
        Copy-Item $file -Destination $tempFolder
        Write-Host "Added: $file" -ForegroundColor Green
    } else {
        Write-Host "Missing: $file" -ForegroundColor Yellow
    }
}

# Create ZIP file
if (Test-Path $zipFileName) {
    Remove-Item $zipFileName -Force
}

Compress-Archive -Path "$tempFolder\*" -DestinationPath $zipFileName -Force

# Clean up temp folder
Remove-Item $tempFolder -Recurse -Force

Write-Host ""
Write-Host "Package created successfully!" -ForegroundColor Green
Write-Host "File: $zipFileName" -ForegroundColor Cyan
Write-Host "Location: $(Get-Location)\$zipFileName" -ForegroundColor Cyan

# Show file size
$fileSize = (Get-Item $zipFileName).Length
$fileSizeKB = [math]::Round($fileSize / 1KB, 2)
Write-Host "Size: $fileSizeKB KB" -ForegroundColor Cyan

Write-Host ""
Write-Host "Ready to upload to Chrome Web Store!" -ForegroundColor Green
