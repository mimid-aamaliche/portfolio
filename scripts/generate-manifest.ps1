# Script to generate manifest.json from the /projects folder
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $repoRoot) { $repoRoot = Get-Location }

$projectsDir = Join-Path $repoRoot "projects"
$manifestPath = Join-Path $repoRoot "manifest.json"

$IMAGE_EXT = '\.(png|jpe?g|webp|gif|svg)$'
$VIDEO_EXT = '\.(mp4|webm|mov)$'

$projects = @()

if (Test-Path $projectsDir) {
    $projectFolders = Get-ChildItem -Path $projectsDir -Directory | Sort-Object Name
    foreach ($folder in $projectFolders) {
        $slug = $folder.Name
        $metaPath = Join-Path $folder.FullName "metadata.txt"
        
        $meta = @{
            title = ($slug -replace '-', ' ')
            description = ""
            date = ""
            tech = @()
            link = ""
            highlight = $false
        }
        
        if (Test-Path $metaPath) {
            $lines = Get-Content $metaPath -Encoding UTF8
            foreach ($line in $lines) {
                $trimmed = $line.Trim()
                if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
                $idx = $trimmed.IndexOf(":")
                if ($idx -gt 0) {
                    $key = $trimmed.Substring(0, $idx).Trim().ToLower()
                    $val = $trimmed.Substring($idx + 1).Trim()
                    
                    if ($key -eq "tech" -or $key -eq "tags") {
                        $parsedTech = @($val -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
                        $meta[$key] = $parsedTech
                    } elseif ($key -eq "highlight") {
                        $meta[$key] = ($val -eq "true")
                    } else {
                        $meta[$key] = $val
                    }
                }
            }
        }
        
        # Images
        $images = @()
        $imagesDir = Join-Path $folder.FullName "images"
        if (Test-Path $imagesDir) {
            $imgFiles = Get-ChildItem -Path $imagesDir -File | Where-Object { $_.Name -match $IMAGE_EXT }
            foreach ($img in $imgFiles) {
                $images += "projects/$slug/images/$($img.Name)"
            }
        }
        
        # Videos
        $videos = @()
        $videosDir = Join-Path $folder.FullName "videos"
        if (Test-Path $videosDir) {
            $vidFiles = Get-ChildItem -Path $videosDir -File | Where-Object { $_.Name -match $VIDEO_EXT }
            foreach ($vid in $vidFiles) {
                $videos += "projects/$slug/videos/$($vid.Name)"
            }
        }
        
        $projectObj = [PSCustomObject]@{
            slug = $slug
            title = $meta["title"]
            description = $meta["description"]
            tech = @($meta["tech"])
            date = $meta["date"]
            link = $meta["link"]
            highlight = $meta["highlight"]
            images = $images
            videos = $videos
        }
        
        $projects += $projectObj
    }
}

$manifestData = [PSCustomObject]@{
    generatedAt = (Get-Date).ToString("o")
    projects = $projects
}

$manifestJson = $manifestData | ConvertTo-Json -Depth 10
Set-Content -Path $manifestPath -Value $manifestJson -Encoding UTF8
Write-Host "Successfully generated manifest.json with $($projects.Count) projects."
