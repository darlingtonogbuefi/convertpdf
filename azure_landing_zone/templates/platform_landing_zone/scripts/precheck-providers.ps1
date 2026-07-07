$required = @(
  "Microsoft.Network",
  "Microsoft.Compute",
  "Microsoft.Insights",
  "Microsoft.OperationalInsights",
  "Microsoft.ManagedIdentity"
)

foreach ($p in $required) {

    Write-Host "`nChecking $p..."

    # Trigger registration (idempotent)
    az provider register --namespace $p | Out-Null

    $attempt = 0
    $maxAttempts = 30

    do {
        $attempt++

        $state = az provider show -n $p --query registrationState -o tsv
        Write-Host "$p => $state (attempt $attempt)"

        if ($state -eq "Registered") {
            break
        }

        Start-Sleep 10

    } while ($attempt -lt $maxAttempts)

    if ($state -ne "Registered") {
        throw "Provider $p failed to register within expected time."
    }
}
