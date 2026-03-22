param(
    [string]$RootPath = "a:\NOTES - Copy\notes-website",
    [string]$OutputPath = "a:\NOTES - Copy\notes-website\webapp\public\data\file-manifest.json"
)

$subjects = @(
    'BOOKS',
    'CHE110',
    'CSE121',
    'CSE320',
    'ECE249',
    'ECE279',
    'INT306',
    'MEC136',
    'MTH166',
    'PEL121-125',
    'PHY110'
)

function Get-NaturalSortKey {
    param([string]$Value)
    return [regex]::Replace($Value, '\d+', { param($m) $m.Value.PadLeft(20, '0') })
}

function New-FileItem {
    param(
        [string]$WebsiteRoot,
        [System.IO.FileInfo]$File,
        [string]$SubjectRoot
    )

    $relativeToWebsite = ($File.FullName.Substring($WebsiteRoot.Length).TrimStart('\\') -replace '\\', '/')
    $relativeToSubject = ($File.DirectoryName.Substring($SubjectRoot.Length).TrimStart('\\') -replace '\\', '/')
    $groupName = if ([string]::IsNullOrWhiteSpace($relativeToSubject)) { 'General' } else { $relativeToSubject }

    return [PSCustomObject]@{
        displayName  = [System.IO.Path]::GetFileNameWithoutExtension($File.Name)
        fileName     = $File.Name
        extension    = $File.Extension.ToLowerInvariant()
        relativePath = $relativeToWebsite
        group        = $groupName
    }
}

$websiteRoot = (Resolve-Path $RootPath).Path
$filesRoot = Join-Path $websiteRoot 'files'

if (-not (Test-Path $filesRoot)) {
    throw "Files folder not found: $filesRoot"
}

$subjectItems = @()

foreach ($subject in $subjects) {
    $subjectFolderName = if ($subject -eq 'BOOKS') { 'Books' } else { $subject }
    $subjectPath = Join-Path $filesRoot $subjectFolderName

    if (-not (Test-Path $subjectPath)) {
        Write-Warning "Skipping missing subject folder: $subjectFolderName"
        continue
    }

    $rawFiles = Get-ChildItem -Path $subjectPath -Recurse -File
    $fileItems = @()

    foreach ($file in $rawFiles) {
        $fileItems += New-FileItem -WebsiteRoot $websiteRoot -File $file -SubjectRoot $subjectPath
    }

    $grouped = @($fileItems |
        Group-Object { $_.group } |
        Sort-Object { Get-NaturalSortKey $_.Name } |
        ForEach-Object {
            $groupName = $_.Name
            $files = @($_.Group |
                Sort-Object { Get-NaturalSortKey $_.fileName } |
                ForEach-Object {
                    [PSCustomObject]@{
                        displayName  = $_.displayName
                        fileName     = $_.fileName
                        extension    = $_.extension
                        relativePath = $_.relativePath
                    }
                })

            [PSCustomObject]@{
                name  = $groupName
                files = $files
            }
        })

    $subjectItems += [PSCustomObject]@{
        code      = $subject
        fileCount = $fileItems.Count
        groups    = $grouped
    }
}

$manifest = [PSCustomObject]@{
    generatedAt = (Get-Date).ToString('s')
    subjects    = @($subjectItems)
}

$outputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$manifest | ConvertTo-Json -Depth 8 | Set-Content -Path $OutputPath -Encoding UTF8
Write-Host "Manifest generated at: $OutputPath"
