<#
.SYNOPSIS
    Provisiona o ambiente completo do lab da Azure Academy (Modulos 3 a 6).

.DESCRIPTION
    Cria, numa unica assinatura:
      - Grupo de recursos
      - App Service Plan B1 Windows + 3 Web Apps (dev / test / prod)
      - SQL Server + banco na OFERTA GRATUITA (free limit)
      - Regras de firewall do SQL
      - Automation Account + runbook 'sqlescala'

    Escrito a partir do que realmente funcionou em 30/08/2026 nesta conta.
    Cada decisao aparentemente estranha aqui existe por causa de um bloqueio
    real encontrado - veja ../ambiente-lab-azure.md secao "Armadilhas".

.NOTES
    Pre-requisitos:
      - Azure CLI instalado      -> winget install Microsoft.AzureCLI
      - Logado                   -> az login --use-device-code
      - Extensao automation      -> az extension add --name automation

    Custo estimado: ~R$ 2,30/dia (so o plano B1; SQL e Automation ficam no free tier).
    Para zerar: rode destruir-lab-azure.ps1
#>

[CmdletBinding()]
param(
    # Assinatura alvo. Vazio = usa a que estiver selecionada no 'az account show'.
    # Descubra a sua com:  az account list -o table
    [string]$SubscriptionId = '',

    [string]$ResourceGroup  = 'AzureAcademy',

    # Regiao do GRUPO. Metadado apenas - os recursos ficam em $ResourceLocation.
    [string]$GroupLocation  = 'brazilsouth',

    # ATENCAO: nesta conta a quota de compute e ZERO nas regioes das Americas.
    # West Europe foi a unica que aceitou criar App Service Plan.
    [string]$ResourceLocation = 'westeurope',

    # Prefixo dos recursos. PRECISA ser unico globalmente (vira DNS).
    [string]$Prefix = 'academy-mvc-wsousa',

    [string]$PlanName     = 'plan-academy-b1',
    [string]$SqlServer    = 'sql-academy-wsousa',
    [string]$SqlDatabase  = 'AzureAcademyDB',
    [string]$SqlAdmin     = 'sqladmin',
    [string]$AutomationAccount = 'auto-academy-wsousa',
    [string]$RunbookName  = 'sqlescala',

    # Onde gravar a senha gerada. NAO versione este arquivo.
    [string]$CredentialFile = "$env:TEMP\azureacademy-sql-credentials.txt"
)

$ErrorActionPreference = 'Stop'
$az = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"
if (-not (Test-Path $az)) { $az = (Get-Command az -ErrorAction Stop).Source }

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# ---------------------------------------------------------------- assinatura
Step "Selecionando assinatura"
if ($SubscriptionId) { & $az account set --subscription $SubscriptionId }
& $az account show --query "{nome:name, id:id, estado:state}" -o table

# ------------------------------------------------------- resource providers
# Assinatura nova costuma vir com providers NAO registrados. Sem isso o
# 'create' falha com uma mensagem que nao menciona registro nenhum.
Step "Registrando resource providers (idempotente)"
foreach ($p in 'Microsoft.Web','Microsoft.Sql','Microsoft.Automation') {
    $estado = & $az provider show -n $p --query registrationState -o tsv 2>$null
    if ($estado -ne 'Registered') {
        Write-Host "  registrando $p ..."
        & $az provider register -n $p --wait
    } else {
        Write-Host "  $p ja registrado"
    }
}

# ----------------------------------------------------------- grupo de recursos
Step "Grupo de recursos"
& $az group create -n $ResourceGroup -l $GroupLocation -o table

# --------------------------------------------------------- app service plan
# --is-linux false e OBRIGATORIO: sem ele o CLI cria plano Linux, que nao roda
# a app ASP.NET Framework do repo build_mvc.
# SKU B1: Standard (S1) esta BLOQUEADO nesta conta. B1 nao tem deployment slots.
Step "App Service Plan (B1 Windows)"
& $az appservice plan create `
    -g $ResourceGroup -n $PlanName `
    --sku B1 --location $ResourceLocation --is-linux false `
    --query "{nome:name, sku:sku.name, local:location}" -o table

# ------------------------------------------------------------------ web apps
# Runtime com DOIS PONTOS (ASPNET:V4.8). Com pipe (ASPNET|V4.8) o cmd.exe
# interpreta o | como pipe e quebra a chamada.
# Os 3 apps dividem o MESMO plano -> a cobranca e por plano, nao por app.
Step "Web Apps (dev / test / prod)"
foreach ($sufixo in @('', '-dev', '-test')) {
    $nome = "$Prefix$sufixo"
    Write-Host "  criando $nome ..."
    & $az webapp create `
        -g $ResourceGroup -p $PlanName -n $nome `
        --runtime 'ASPNET:V4.8' `
        --query "{nome:name, host:defaultHostName, estado:state}" -o table
}

# --------------------------------------------------------------- senha do SQL
# Charset restrito de proposito: caracteres como ! ( ) & | " ' $ ; quebram o
# az.cmd, que passa por cmd.exe. Ja perdemos uma senha assim - ela vazou no
# stack trace do erro.
Step "Gerando senha do SQL"
$chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789-_.".ToCharArray()
$bytes = New-Object byte[] 28
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$SqlPassword = "Az" + (-join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })) + "9_"

@"
servidor: $SqlServer.database.windows.net
login:    $SqlAdmin
senha:    $SqlPassword

Trocar depois com:
  az sql server update -g $ResourceGroup -n $SqlServer --admin-password '<NOVA>'
"@ | Set-Content -Path $CredentialFile -Encoding utf8
Write-Host "  credenciais gravadas em: $CredentialFile" -ForegroundColor Yellow

# ----------------------------------------------------------------- sql server
Step "SQL Server"
& $az sql server create `
    -g $ResourceGroup -n $SqlServer -l $ResourceLocation `
    -u $SqlAdmin -p $SqlPassword `
    --query "{nome:name, fqdn:fullyQualifiedDomainName, estado:state}" -o table

# ---------------------------------------------------------------- sql database
# --use-free-limit e o que mantem o banco em R$ 0.
#   * 100.000 vCore-segundos/mes + 32 GB
#   * UM banco gratuito POR ASSINATURA
#   * AutoPause = ao esgotar a cota, pausa em vez de cobrar
# Sem essa flag o portal sugere Basic (~US$ 5/mes) por padrao.
Step "SQL Database (oferta gratuita)"
& $az sql db create `
    -g $ResourceGroup -s $SqlServer -n $SqlDatabase `
    --edition GeneralPurpose --compute-model Serverless --family Gen5 --capacity 2 `
    --use-free-limit --free-limit-exhaustion-behavior AutoPause `
    --backup-storage-redundancy Local `
    --query "{nome:name, sku:sku.name, tier:sku.tier, gratuito:useFreeLimit, estado:status}" -o table

# ------------------------------------------------------------ firewall do SQL
# 0.0.0.0 NAO e curinga de internet: e o marcador especial "servicos do Azure".
# E por essa regra que o runbook e os web apps conseguem conectar.
Step "Firewall do SQL"
& $az sql server firewall-rule create `
    -g $ResourceGroup -s $SqlServer -n AllowAzureServices `
    --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0 -o none

$meuIp = (Invoke-RestMethod -Uri 'https://api.ipify.org?format=json' -TimeoutSec 20).ip
Write-Host "  IP publico detectado: $meuIp"
& $az sql server firewall-rule create `
    -g $ResourceGroup -s $SqlServer -n MeuIP `
    --start-ip-address $meuIp --end-ip-address $meuIp -o none

& $az sql server firewall-rule list -g $ResourceGroup -s $SqlServer `
    --query "[].{regra:name, inicio:startIpAddress, fim:endIpAddress}" -o table

# ------------------------------------------------------- automation account
# Free tier: 500 minutos de execucao por mes.
Step "Automation Account"
& $az automation account create `
    -g $ResourceGroup -n $AutomationAccount -l $ResourceLocation --sku Free `
    --query "{nome:name, sku:sku.name, estado:state}" -o table

# ----------------------------------------------------- variavel criptografada
# A senha NAO vai hardcoded no runbook. O script le com Get-AutomationVariable.
Step "Variavel criptografada SqlPass"
& $az automation variable create `
    -g $ResourceGroup --automation-account-name $AutomationAccount `
    -n SqlPass --value "`"$SqlPassword`"" --is-encrypted true `
    --query "{nome:name, criptografada:isEncrypted}" -o table

# ------------------------------------------------------------------- runbook
Step "Runbook $RunbookName"
$runbookPath = Join-Path $PSScriptRoot 'sqlescala.ps1'
if (-not (Test-Path $runbookPath)) { throw "Nao encontrei $runbookPath" }

# Injeta os nomes reais no script antes de subir
(Get-Content $runbookPath -Raw) `
    -replace '__SERVIDOR__', "$SqlServer.database.windows.net" `
    -replace '__DATABASE__', $SqlDatabase `
    -replace '__USUARIO__',  $SqlAdmin |
    Set-Content "$env:TEMP\_sqlescala_render.ps1" -Encoding utf8

& $az automation runbook create `
    -g $ResourceGroup --automation-account-name $AutomationAccount `
    -n $RunbookName --type PowerShell --location $ResourceLocation -o none

& $az automation runbook replace-content `
    -g $ResourceGroup --automation-account-name $AutomationAccount `
    -n $RunbookName --content "@$env:TEMP\_sqlescala_render.ps1" -o none

& $az automation runbook publish `
    -g $ResourceGroup --automation-account-name $AutomationAccount `
    -n $RunbookName -o none

& $az automation runbook show `
    -g $ResourceGroup --automation-account-name $AutomationAccount -n $RunbookName `
    --query "{nome:name, tipo:runbookType, estado:state}" -o table

Remove-Item "$env:TEMP\_sqlescala_render.ps1" -ErrorAction SilentlyContinue

# ------------------------------------------------------------------ inventario
Step "Inventario final"
& $az resource list -g $ResourceGroup --query "[].{nome:name, tipo:type, local:location}" -o table

Write-Host @"

PRONTO.

  Senha do SQL: $CredentialFile
  Custo:        ~R$ 2,30/dia (plano B1). SQL e Automation em free tier.
  Para destruir: .\destruir-lab-azure.ps1

Ainda falta no Azure DevOps (nao da para automatizar sem PAT):
  1. Service connection ARM apontando para esta assinatura
  2. Release pipeline com os 3 stages
  Veja ../ambiente-lab-azure.md secao "Lado Azure DevOps".

"@ -ForegroundColor Green
