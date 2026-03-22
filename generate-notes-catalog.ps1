$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourcePath = Join-Path $root "webapp\public\data\notes-catalog.json"
$outputDir = Join-Path $root "webapp\public\data"
$outputPath = Join-Path $outputDir "notes-catalog.json"

if (!(Test-Path $sourcePath)) {
    throw "Notes source not found at $sourcePath"
}

if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$tempScript = Join-Path $env:TEMP "extract-notes-catalog.js"

$nodeScript = @'
const fs = require("fs");

const inputPath = process.argv[2];
const outputPath = process.argv[3];

const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const subjects = input && typeof input.subjects === "object" ? input.subjects : null;

if (!subjects) {
  throw new Error("Unable to locate subjects object in notes source JSON");
}
const bySemester = {};

for (const [key, value] of Object.entries(subjects)) {
  const underscore = key.indexOf("_");
  if (underscore === -1) continue;

  const sem = key.slice(0, underscore);
  const code = key.slice(underscore + 1);
  if (!bySemester[sem]) bySemester[sem] = [];

  bySemester[sem].push({
    key,
    sem,
    code,
    name: value?.name || code,
    desc: value?.desc || "",
    units: Array.isArray(value?.units) ? value.units : [],
  });
}

for (const sem of Object.keys(bySemester)) {
  bySemester[sem].sort((a, b) => a.code.localeCompare(b.code));
}

const payload = {
  generatedAt: new Date().toISOString(),
  subjects,
  bySemester,
};

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf8");
console.log(`Notes catalog generated at: ${outputPath}`);
'@

Set-Content -Path $tempScript -Value $nodeScript -Encoding UTF8

node $tempScript $sourcePath $outputPath

Remove-Item $tempScript -ErrorAction SilentlyContinue