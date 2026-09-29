$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "C:\Users\user\Documents\UMBRELLA\docs\screenshots"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$shots = @(
    @{ name = "01_command_center_dashboard.png"; url = "http://127.0.0.1:3000/dashboard"; w = 1440; h = 900; time = 5000 },
    @{ name = "02_live_flood_risk_radar.png"; url = "http://127.0.0.1:3000/live-risk"; w = 1440; h = 900; time = 6000 },
    @{ name = "03_historical_replay_t7.png"; url = "http://127.0.0.1:3000/historical-replay?date=2020-07-18"; w = 1440; h = 900; time = 8000 },
    @{ name = "04_historical_replay_t0_peak.png"; url = "http://127.0.0.1:3000/historical-replay?date=2020-07-25"; w = 1440; h = 900; time = 8000 },
    @{ name = "05_portfolio_exposure_scatter.png"; url = "http://127.0.0.1:3000/portfolio"; w = 1440; h = 900; time = 5000 },
    @{ name = "06_action_center_early_warning.png"; url = "http://127.0.0.1:3000/actions"; w = 1440; h = 900; time = 5000 },
    @{ name = "07_resilience_catalog.png"; url = "http://127.0.0.1:3000/green-finance"; w = 1440; h = 900; time = 5000 },
    @{ name = "08_green_finance_calculator.png"; url = "http://127.0.0.1:3000/green-finance"; w = 1440; h = 900; time = 5000 },
    @{ name = "09_human_decision_modal.png"; url = "http://127.0.0.1:3000/actions?modal=true"; w = 1440; h = 900; time = 5000 },
    @{ name = "10_field_verification_checklist.png"; url = "http://127.0.0.1:3000/field-officer"; w = 1440; h = 900; time = 5000 },
    @{ name = "11_dual_track_impact_dashboard.png"; url = "http://127.0.0.1:3000/impact"; w = 1440; h = 900; time = 5000 },
    @{ name = "12_asset_lifecycle_traceability.png"; url = "http://127.0.0.1:3000/assets/AST-DAR-HAY-001"; w = 1440; h = 900; time = 5000 },
    @{ name = "13_mobile_field_officer.png"; url = "http://127.0.0.1:3000/field-officer"; w = 390; h = 844; time = 5000 },
    @{ name = "14_mobile_command_center.png"; url = "http://127.0.0.1:3000/dashboard"; w = 390; h = 844; time = 5000 }
)

foreach ($s in $shots) {
    $outFile = Join-Path $outDir $s.name
    $t = if ($s.time) { $s.time } else { 5000 }
    $argList = @(
        "--headless",
        "--disable-gpu",
        "--window-size=$($s.w),$($s.h)",
        "--virtual-time-budget=$t",
        "--run-all-compositor-stages-before-draw",
        "--screenshot=$outFile",
        $s.url
    )
    Write-Host "Capturing $($s.name) ($($s.w)x$($s.h))..."
    $proc = Start-Process -FilePath $chrome -ArgumentList $argList -Wait -PassThru
    if (Test-Path $outFile) {
        $len = (Get-Item $outFile).Length
        Write-Host "  -> Done ($len bytes)"
    } else {
        Write-Warning "  -> Failed to generate $outFile"
    }
}
Write-Host "All screenshots processed."
