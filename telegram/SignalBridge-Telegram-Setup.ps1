param(
  [Parameter(Mandatory=$true)][string]$BotToken,
  [Parameter(Mandatory=$true)][string]$ConnectionId,
  [Parameter(Mandatory=$true)][string]$WebhookSecret,
  [Parameter(Mandatory=$true)][string]$PairCode
)
$ErrorActionPreference = "Stop"
$webhook = "https://signalbridge.drfx.online/v1/ingress/telegram/$ConnectionId"
$uri = "https://api.telegram.org/bot$BotToken/setWebhook"
$payload = @{
  url = $webhook
  secret_token = $WebhookSecret
  allowed_updates = @("message","channel_post","edited_message","edited_channel_post")
  drop_pending_updates = $true
} | ConvertTo-Json -Depth 4
$result = Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json" -Body $payload
$result | ConvertTo-Json -Depth 6
Write-Host ""
Write-Host "Webhook: $webhook"
Write-Host "First pair the exact chat/channel allowed to send signals:"
Write-Host "/signalbridge_pair $PairCode"
Write-Host ""
Write-Host "After pairing succeeds, send a broker-valid test signal:"
Write-Host "XAUUSD BUY"
Write-Host "LOT 0.01"
Write-Host "SL 2700"
Write-Host "TP1 2720"
Write-Host "TP2 2730"
Write-Host "TP3 2740"
