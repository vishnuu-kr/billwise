$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "d:\projects\billwise\screenshots\viewports"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$viewports = @(
    @{ width = 360; height = 780; name = "phone_small_360" },
    @{ width = 393; height = 852; name = "phone_standard_393" },
    @{ width = 430; height = 932; name = "phone_large_430" },
    @{ width = 1024; height = 768; name = "tablet_1024" },
    @{ width = 1440; height = 900; name = "desktop_1440" }
)

foreach ($vp in $viewports) {
    $outFile = Join-Path $outDir "home_$($vp.name).png"
    Write-Host "Capturing home at $($vp.width)x$($vp.height)..."
    Start-Process -FilePath $chrome -ArgumentList @(
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=$($vp.width),$($vp.height)",
        "--screenshot=$outFile",
        "http://localhost:3000/"
    ) -Wait
}

Write-Host "Viewport captures complete!"
