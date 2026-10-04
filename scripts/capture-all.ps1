$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "d:\projects\billwise\screenshots"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$routes = @(
    @{ path = "/"; name = "home" },
    @{ path = "/predict"; name = "predict" },
    @{ path = "/scan"; name = "scan" },
    @{ path = "/result"; name = "result" },
    @{ path = "/manual"; name = "manual" },
    @{ path = "/what-if"; name = "what-if" },
    @{ path = "/budget"; name = "budget" },
    @{ path = "/history"; name = "history" },
    @{ path = "/usage"; name = "usage" },
    @{ path = "/appliances"; name = "appliances" },
    @{ path = "/tariff"; name = "tariff" },
    @{ path = "/explain"; name = "explain" },
    @{ path = "/settings"; name = "settings" },
    @{ path = "/about"; name = "about" },
    @{ path = "/privacy"; name = "privacy" },
    @{ path = "/how-it-works"; name = "how-it-works" }
)

foreach ($r in $routes) {
    $outFile = Join-Path $outDir "$($r.name).png"
    $url = "http://localhost:3000$($r.path)"
    Write-Host "Capturing $($r.path) to $($r.name).png ..."
    Start-Process -FilePath $chrome -ArgumentList @(
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=390,844",
        "--screenshot=$outFile",
        $url
    ) -Wait
}

Write-Host "All screenshots captured successfully!"
