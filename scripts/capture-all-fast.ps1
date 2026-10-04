$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "D:\projects\billwise\screenshots\gate"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$screens = @(
    @{ name = "1-first-time-home"; url = "http://localhost:3000/" },
    @{ name = "2-returning-home"; url = "http://localhost:3000/?mode=returning" },
    @{ name = "3-result"; url = "http://localhost:3000/result?units=240&days=60&prevBill=1148" },
    @{ name = "4-quick-meter-update"; url = "http://localhost:3000/?mode=quick-update" },
    @{ name = "5-history"; url = "http://localhost:3000/history" },
    @{ name = "6-tools-sheet"; url = "http://localhost:3000/?sheet=more" },
    @{ name = "7-scan"; url = "http://localhost:3000/scan" },
    @{ name = "8-manual"; url = "http://localhost:3000/manual" }
)

foreach ($s in $screens) {
    $outPath = Join-Path $outDir "$($s.name).png"
    Write-Host "Capturing $($s.name) from $($s.url)..."
    & $chrome --headless=new --disable-gpu --window-size=390,844 --virtual-time-budget=2000 --screenshot="$outPath" "$($s.url)"
}

Write-Host "All 8 screenshots successfully captured!"
