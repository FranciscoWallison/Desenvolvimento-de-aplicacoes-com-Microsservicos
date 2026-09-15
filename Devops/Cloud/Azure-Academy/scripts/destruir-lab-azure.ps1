<#
.SYNOPSIS
    Apaga TODO o ambiente do lab e zera o custo.

.DESCRIPTION
    Remove o grupo de recursos inteiro. Isso leva junto:
      - App Service Plan e os 3 Web Apps
      - SQL Server e o banco
      - Automation Account e os runbooks

    NAO e reversivel. O que sobrevive (e nao custa nada) fica no Azure DevOps:
    service connection, build pipeline e release pipeline continuam la,
    apontando para recursos que deixaram de existir.

.NOTES
    Rode com -Confirmar para executar de verdade. Sem a flag, so mostra
    o que seria apagado.
#>

[CmdletBinding()]
param(
    # Vazio = usa a assinatura selecionada no momento
    [string]$SubscriptionId = '',
    [string]$ResourceGroup  = 'AzureAcademy',

    # Guarda de seguranca: sem isso o script so lista, nao apaga.
    [switch]$Confirmar
)

$ErrorActionPreference = 'Stop'
$az = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
if (-not (Test-Path $az)) { $az = (Get-Command az -ErrorAction Stop).Source }

if ($SubscriptionId) { & $az account set --subscription $SubscriptionId }

Write-Host "`nRecursos em '$ResourceGroup' que seriam apagados:" -ForegroundColor Yellow
& $az resource list -g $ResourceGroup --query "[].{nome:name, tipo:type, local:location}" -o table

if (-not $Confirmar) {
    Write-Host @"

Nada foi apagado. Isto foi apenas uma previa.

Para apagar de verdade:
    .\destruir-lab-azure.ps1 -Confirmar

"@ -ForegroundColor Cyan
    return
}

Write-Host "`nApagando o grupo de recursos '$ResourceGroup' ..." -ForegroundColor Red
& $az group delete -n $ResourceGroup --yes --no-wait

Write-Host @"

Exclusao disparada em segundo plano (--no-wait).

Acompanhe com:
    az group show -n $ResourceGroup

Quando responder 'ResourceGroupNotFound', acabou e o custo esta zerado.

"@ -ForegroundColor Green
