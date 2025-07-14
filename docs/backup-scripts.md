# Extension Backup Script

## PowerShell Backup Script (Windows)

Create a file named `backup-extension.ps1`:

```powershell
# Extension Backup Script for Music Controller
# Run this script before each update

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupPath = ".\backups"
)

# Create backup directory structure
$backupDir = "$BackupPath\music_controller_v$Version"
$dateStr = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$versionBackupDir = "$backupDir\$dateStr"

Write-Host "Creating backup for Music Controller v$Version..." -ForegroundColor Green

# Create directories
New-Item -ItemType Directory -Path $versionBackupDir -Force | Out-Null
New-Item -ItemType Directory -Path "$versionBackupDir\source" -Force | Out-Null

# Copy source files (exclude sensitive data)
$sourceFiles = @(
    "background.js",
    "content.js", 
    "manifest.json",
    "popup.html",
    "popup.js",
    "*.png",
    "*.svg",
    "README.md"
)

foreach ($pattern in $sourceFiles) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | 
        Copy-Item -Destination "$versionBackupDir\source" -Force
}

# Copy docs folder
if (Test-Path "docs") {
    Copy-Item -Path "docs" -Destination "$versionBackupDir\docs" -Recurse -Force
}

# Create metadata file
$metadata = @{
    version = $Version
    backup_date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    extension_id = "jjbfalkjirfhfnpnookhgefdcnimopn"
    git_commit = (git rev-parse HEAD 2>$null)
    git_branch = (git branch --show-current 2>$null)
} | ConvertTo-Json -Depth 2

$metadata | Out-File -FilePath "$versionBackupDir\metadata.json" -Encoding UTF8

# Create backup checklist
$checklist = @"
# Backup Checklist for Music Controller v$Version

## Files Backed Up:
- [x] Source code files
- [x] Documentation
- [x] Manifest.json
- [x] Assets (icons, images)
- [x] Metadata

## Manual Steps Required:
- [ ] Download CRX file from Chrome Web Store
- [ ] Save CRX file to: $versionBackupDir\
- [ ] Update version in manifest.json for next release
- [ ] Test extension locally before submission
- [ ] Upload new package to Chrome Web Store
- [ ] Download new CRX file after successful submission

## Backup Location:
$versionBackupDir

## Notes:
- Extension ID: jjbfalkjirfhfnpnookhgefdcnimopn
- Backup Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- Git Commit: $(git rev-parse HEAD 2>$null)

"@

$checklist | Out-File -FilePath "$versionBackupDir\CHECKLIST.md" -Encoding UTF8

Write-Host "Backup completed successfully!" -ForegroundColor Green
Write-Host "Backup location: $versionBackupDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Download CRX file from Chrome Web Store" -ForegroundColor White
Write-Host "2. Save CRX file to the backup directory" -ForegroundColor White
Write-Host "3. Follow the checklist in CHECKLIST.md" -ForegroundColor White
```

## Usage:

```powershell
# Create backup for version 1.0
.\backup-extension.ps1 -Version "1.0"

# Create backup with custom path
.\backup-extension.ps1 -Version "1.1" -BackupPath "D:\ExtensionBackups"
```

## Bash Script (Linux/Mac)

Create a file named `backup-extension.sh`:

```bash
#!/bin/bash

# Extension Backup Script for Music Controller
# Usage: ./backup-extension.sh <version>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <version> [backup_path]"
    echo "Example: $0 1.0"
    exit 1
fi

VERSION=$1
BACKUP_PATH=${2:-"./backups"}
DATE_STR=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="$BACKUP_PATH/music_controller_v$VERSION/$DATE_STR"

echo "Creating backup for Music Controller v$VERSION..."

# Create directories
mkdir -p "$BACKUP_DIR/source"
mkdir -p "$BACKUP_DIR/docs"

# Copy source files
cp background.js content.js manifest.json popup.html popup.js *.png *.svg README.md "$BACKUP_DIR/source/" 2>/dev/null

# Copy docs folder
cp -r docs/* "$BACKUP_DIR/docs/" 2>/dev/null

# Create metadata file
cat > "$BACKUP_DIR/metadata.json" << EOF
{
  "version": "$VERSION",
  "backup_date": "$(date)",
  "extension_id": "jjbfalkjirfhfnpnookhgefdcnimopn",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null)",
  "git_branch": "$(git branch --show-current 2>/dev/null)"
}
EOF

# Create checklist
cat > "$BACKUP_DIR/CHECKLIST.md" << EOF
# Backup Checklist for Music Controller v$VERSION

## Files Backed Up:
- [x] Source code files
- [x] Documentation  
- [x] Manifest.json
- [x] Assets (icons, images)
- [x] Metadata

## Manual Steps Required:
- [ ] Download CRX file from Chrome Web Store
- [ ] Save CRX file to: $BACKUP_DIR/
- [ ] Update version in manifest.json for next release
- [ ] Test extension locally before submission
- [ ] Upload new package to Chrome Web Store
- [ ] Download new CRX file after successful submission

## Backup Location:
$BACKUP_DIR

## Notes:
- Extension ID: jjbfalkjirfhfnpnookhgefdcnimopn
- Backup Date: $(date)
- Git Commit: $(git rev-parse HEAD 2>/dev/null)
EOF

echo "Backup completed successfully!"
echo "Backup location: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "1. Download CRX file from Chrome Web Store"
echo "2. Save CRX file to the backup directory"
echo "3. Follow the checklist in CHECKLIST.md"
```

## Make it executable:
```bash
chmod +x backup-extension.sh
```
