<#
.SYNOPSIS
    Audita o que gera custo nas assinaturas do Azure. SO LE, nunca altera nada.

.DESCRIPTION
    Varre cada assinatura e classifica o que encontra em tres grupos:

      VERMELHO - preco fixo: cobra parado, integral. E aqui que o dinheiro sai.
      AMARELO  - por uso com pegadinha: polling, egress, armazenamento.
      VERDE    - por uso puro ou free tier: parado custa R$ 0.

    Checa especificamente as armadilhas encontradas na pratica:
      - App Service Plan em tier pago (cobra por PLANO, nao por app)
      - Static Web App em Standard (US$ 9/app/mes, mesmo sem trafego)
      - Deployment de IA em SKU Provisioned/PTU (reserva capacidade)
      - Spark pool SEM auto-pause (o unico jeito de ele sangrar)
      - Discos gerenciados orfaos (sobrevivem a VM apagada)
      - VMs desalocadas (compute para, disco continua)
      - Azure SQL fora do free offer

    O que este script NAO consegue ver: os jobs paralelos do Azure DevOps.
    Eles nao sao recurso do Azure e nao aparecem em 'az resource list' - so
    na tela _settings/buildqueue?_a=concurrentJobs da organizacao. Aparecem no
    custo como servico "Azure DevOps".

.EXAMPLE
    .\auditar-custos.ps1
    Audita todas as assinaturas visiveis, com consulta de custo.

.EXAMPLE
    .\auditar-custos.ps1 -SubscriptionId 057d3c78-e127-4329-88e8-6dd8d6bab0b9

.EXAMPLE
    .\auditar-custos.ps1 -SemCusto
    Pula a Cost Management API. Use quando ela estiver devolvendo 429.

.NOTES
    Pre-requisito: az login.
    Documentacao: ../custos-desligamento-e-validacao.md
#>

[CmdletBinding()]
param(
    # Vazio = audita TODAS as assinaturas habilitadas
    [string]$SubscriptionId = '',

    # Pula a Cost Management API (que limita a ~1 consulta/min e devolve 429)
    [switch]$SemCusto
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------- utilidades

function Escrever-Titulo([string]$Texto) {
    Write-Host ''
    Write-Host ('=' * 78) -ForegroundColor DarkGray
    Write-Host "  $Texto" -ForegroundColor Cyan
    Write-Host ('=' * 78) -ForegroundColor DarkGray
}

function Escrever-Secao([string]$Texto) {
    Write-Host ''
    Write-Host "-- $Texto" -ForegroundColor White
}

# Achados vao para uma lista unica, com severidade, para o resumo final
$script:Achados = New-Object System.Collections.Generic.List[object]

function Registrar([string]$Nivel, [string]$Recurso, [string]$Problema, [string]$Acao) {
    $script:Achados.Add([pscustomobject]@{
        Nivel    = $Nivel      # VERMELHO | AMARELO | VERDE
        Recurso  = $Recurso
        Problema = $Problema
        Acao     = $Acao
    })

    $cor = switch ($Nivel) {
        'VERMELHO' { 'Red' }
        'AMARELO'  { 'Yellow' }
        default    { 'Green' }
    }
    Write-Host ("   [{0,-8}] {1}" -f $Nivel, $Recurso) -ForegroundColor $cor
    Write-Host ("              {0}" -f $Problema) -ForegroundColor DarkGray
}

# Envolve chamadas do az que podem falhar por permissao/extensao ausente.
# Sem isso, uma assinatura sem acesso a um provider derruba a auditoria inteira.
#
# ARMADILHA (custou uma execucao inteira devolvendo "vazio"): no PowerShell 5.1,
# qualquer coisa que o az escreva em stderr - ate um WARNING inofensivo - vira um
# NativeCommandError. Com $ErrorActionPreference = 'Stop' isso e TERMINANTE, o
# catch engole, e a funcao devolve $null. Resultado: uma assinatura cheia de
# recursos aparece como vazia, sem nenhum erro na tela.
# Por isso o EA e rebaixado aqui dentro e restaurado no finally.
function Invocar-Az([string]$Comando) {
    $preferenciaAnterior = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    try {
        # 2>$null descarta o stderr do az (warnings de preview poluem a saida).
        # So e seguro por causa do EA rebaixado acima - ver comentario.
        $saida = Invoke-Expression "$Comando 2>`$null"
        if ($LASTEXITCODE -ne 0) { return $null }

        $texto = ($saida | Out-String).Trim()
        if ([string]::IsNullOrWhiteSpace($texto)) { return $null }
        return (ConvertFrom-Json $texto)
    } catch {
        return $null
    } finally {
        $ErrorActionPreference = $preferenciaAnterior
        # az deixa LASTEXITCODE sujo; sem isso o script inteiro sai com codigo != 0
        $global:LASTEXITCODE = 0
    }
}

# ---------------------------------------------------------- 0. assinaturas

Escrever-Titulo 'AUDITORIA DE CUSTO - Azure'

$conta = Invocar-Az 'az account show -o json'
if (-not $conta) {
    Write-Host 'Nao autenticado. Rode: az login' -ForegroundColor Red
    exit 1
}
Write-Host ("Autenticado como: {0}" -f $conta.user.name) -ForegroundColor DarkGray

if ($SubscriptionId) {
    $assinaturas = @(Invocar-Az "az account show --subscription $SubscriptionId -o json")
} else {
    $assinaturas = @(Invocar-Az 'az account list --query "[?state==''Enabled'']" -o json')
}

if (-not $assinaturas -or $assinaturas.Count -eq 0) {
    Write-Host 'Nenhuma assinatura habilitada encontrada.' -ForegroundColor Red
    exit 1
}
Write-Host ("Assinaturas a auditar: {0}" -f $assinaturas.Count) -ForegroundColor DarkGray

foreach ($assin in $assinaturas) {

    $id = $assin.id
    Escrever-Titulo ("ASSINATURA: {0}" -f $assin.name)
    Write-Host ("  id: {0}" -f $id) -ForegroundColor DarkGray

    # ---- tipo de oferta e limite de gasto ---------------------------------
    # quotaId revela se e Pay-As-You-Go, Free Trial, MSDN etc.
    # spendingLimit 'On' bloqueia o recurso ao fim do credito; 'Off' cobra.
    $detalhe = Invocar-Az "az rest --method get --url ""https://management.azure.com/subscriptions/$id`?api-version=2022-12-01"" -o json"
    if ($detalhe) {
        Write-Host ("  oferta: {0} | limite de gasto: {1}" -f `
            $detalhe.subscriptionPolicies.quotaId, `
            $detalhe.subscriptionPolicies.spendingLimit) -ForegroundColor DarkGray
    }

    # ---- inventario bruto -------------------------------------------------
    Escrever-Secao 'Inventario'
    $recursos = Invocar-Az "az resource list --subscription $id -o json"
    if (-not $recursos -or $recursos.Count -eq 0) {
        Write-Host '   (vazia - nada custando)' -ForegroundColor Green
        continue
    }

    $recursos |
        Group-Object type |
        Sort-Object Count -Descending |
        ForEach-Object { Write-Host ("   {0,3}x  {1}" -f $_.Count, $_.Name) -ForegroundColor DarkGray }

    # ---- 1. App Service Plans --------------------------------------------
    # Cobra por PLANO, nao por app. Um plano B1 com 3 web apps custa o mesmo
    # que com 1 - e continua cobrando com ZERO app dentro.
    Escrever-Secao 'App Service Plans'
    $planos = Invocar-Az "az appservice plan list --subscription $id -o json"
    if (-not $planos) {
        Write-Host '   nenhum' -ForegroundColor Green
    } else {
        foreach ($p in $planos) {
            $tier = $p.sku.tier
            if ($tier -eq 'Free') {
                Registrar 'VERDE' "$($p.name) [$($p.resourceGroup)]" `
                    "Tier $tier (F1) - gratuito" 'nada a fazer'
            } else {
                $apps = if ($null -ne $p.numberOfSites) { $p.numberOfSites } else { '?' }
                Registrar 'VERMELHO' "$($p.name) [$($p.resourceGroup)]" `
                    "Tier $tier - preco FIXO por plano, $apps app(s) dentro" `
                    "az appservice plan delete -n $($p.name) -g $($p.resourceGroup)"
            }
        }
    }

    # ---- 2. Static Web Apps ----------------------------------------------
    # Standard so vale a pena com linked backend, staging, dominio proprio,
    # auth customizada ou enterprise edge. Sem nada disso, e dinheiro jogado fora.
    Escrever-Secao 'Static Web Apps'
    $swas = Invocar-Az "az staticwebapp list --subscription $id -o json"
    if (-not $swas) {
        Write-Host '   nenhuma' -ForegroundColor Green
    } else {
        foreach ($s in $swas) {
            if ($s.sku.name -eq 'Free') {
                Registrar 'VERDE' "$($s.name) [$($s.resourceGroup)]" `
                    'SKU Free - gratuito' 'nada a fazer'
                continue
            }

            # Antes de recomendar o downgrade, checa se o Standard esta em uso
            $ambientes = Invocar-Az "az staticwebapp environment list --subscription $id -n $($s.name) -g $($s.resourceGroup) -o json"
            $dominios  = Invocar-Az "az staticwebapp hostname list    --subscription $id -n $($s.name) -g $($s.resourceGroup) -o json"

            # o ambiente 'default' e a producao, nao conta como staging
            $qtdStaging  = @($ambientes | Where-Object { $_.name -ne 'default' }).Count
            $qtdDominios = @($dominios).Count
            $edge        = ($s.enterpriseGradeCdnStatus -eq 'Enabled')

            if ($qtdStaging -eq 0 -and $qtdDominios -eq 0 -and -not $edge) {
                Registrar 'VERMELHO' "$($s.name) [$($s.resourceGroup)]" `
                    'SKU Standard (~US$ 9/mes) SEM staging, SEM dominio proprio, SEM enterprise edge' `
                    "az staticwebapp update -n $($s.name) -g $($s.resourceGroup) --sku Free"
            } else {
                Registrar 'AMARELO' "$($s.name) [$($s.resourceGroup)]" `
                    "SKU Standard EM USO: $qtdStaging staging, $qtdDominios dominio(s), edge=$edge" `
                    'avaliar caso a caso - o Standard esta comprando algo'
            }
        }
    }

    # ---- 3. Deployments de IA --------------------------------------------
    # Standard = por token, ocioso custa R$ 0.
    # ProvisionedManaged/PTU = reserva capacidade, cobra parado e cobra caro.
    Escrever-Secao 'Azure AI / OpenAI'
    $contas = Invocar-Az "az cognitiveservices account list --subscription $id -o json"
    if (-not $contas) {
        Write-Host '   nenhuma' -ForegroundColor Green
    } else {
        foreach ($c in $contas) {
            $deps = Invocar-Az "az cognitiveservices account deployment list --subscription $id -n $($c.name) -g $($c.resourceGroup) -o json"
            if (-not $deps) {
                Registrar 'VERDE' "$($c.name) [$($c.resourceGroup)]" `
                    "conta $($c.sku.name) sem deployment - nao cobra" 'nada a fazer'
                continue
            }
            foreach ($d in $deps) {
                if ($d.sku.name -match 'Provisioned|PTU|DataZoneProvisioned') {
                    Registrar 'VERMELHO' "$($c.name)/$($d.name)" `
                        "SKU $($d.sku.name) capacidade $($d.sku.capacity) - PROVISIONADO, cobra ocioso" `
                        'trocar para Standard, ou apagar o deployment'
                } else {
                    Registrar 'VERDE' "$($c.name)/$($d.name)" `
                        "SKU $($d.sku.name) - por token, ocioso custa R$ 0" 'nada a fazer'
                }
            }
        }
    }

    # ---- 4. Synapse Spark pools ------------------------------------------
    # Com auto-pause, custa R$ 0 ocioso. Sem auto-pause, cobra vCore-hora 24/7.
    Escrever-Secao 'Synapse Spark pools'
    $ws = Invocar-Az "az synapse workspace list --subscription $id -o json"
    if (-not $ws) {
        Write-Host '   nenhum workspace' -ForegroundColor Green
    } else {
        foreach ($w in $ws) {
            $pools = Invocar-Az "az synapse spark pool list --subscription $id --workspace-name $($w.name) --resource-group $($w.resourceGroup) -o json"
            foreach ($pool in @($pools)) {
                if ($pool.autoPause.enabled) {
                    Registrar 'VERDE' "$($w.name)/$($pool.name)" `
                        "auto-pause ligado ($($pool.autoPause.delayInMinutes) min) - ocioso custa R$ 0" `
                        'nada a fazer'
                } else {
                    Registrar 'VERMELHO' "$($w.name)/$($pool.name)" `
                        "auto-pause DESLIGADO - cobra vCore-hora parado" `
                        "az synapse spark pool update --enable-auto-pause true --delay 15 ..."
                }
            }
        }
    }

    # ---- 5. VMs e discos --------------------------------------------------
    # 'deallocated' para o compute mas NAO o disco. E disco sem VM (orfao)
    # cobra 100% para sempre, sem nada aparecer usando.
    Escrever-Secao 'VMs e discos'
    $vms = Invocar-Az "az vm list --subscription $id -d -o json"
    foreach ($vm in @($vms)) {
        if ($vm.powerState -match 'deallocated') {
            Registrar 'AMARELO' "$($vm.name) [$($vm.resourceGroup)]" `
                'VM desalocada - compute parado, mas o DISCO continua cobrando' `
                'apagar o grupo de recursos para zerar de verdade'
        } else {
            Registrar 'VERMELHO' "$($vm.name) [$($vm.resourceGroup)]" `
                "VM $($vm.powerState) - tamanho $($vm.hardwareProfile.vmSize), preco fixo por hora" `
                "az vm deallocate -n $($vm.name) -g $($vm.resourceGroup)"
        }
    }

    # 'az disk list' EXIGE -g nesta versao da CLI (erro: the following arguments
    # are required: --resource-group/-g). Por isso os discos vem por
    # 'az resource list', que e sempre no escopo da assinatura, e o estado de
    # cada um vem de um 'az disk show' individual.
    $refsDiscos = Invocar-Az "az resource list --subscription $id --resource-type Microsoft.Compute/disks -o json"
    $discos = @()
    foreach ($ref in @($refsDiscos)) {
        $d = Invocar-Az "az disk show --subscription $id -n $($ref.name) -g $($ref.resourceGroup) -o json"
        if ($d) { $discos += $d }
    }
    foreach ($disco in $discos) {
        if ($disco.diskState -eq 'Unattached') {
            Registrar 'VERMELHO' "$($disco.name) [$($disco.resourceGroup)]" `
                "disco ORFAO $($disco.diskSizeGb) GB - nenhuma VM usa, cobra integral" `
                "az disk delete -n $($disco.name) -g $($disco.resourceGroup)"
        } else {
            Registrar 'AMARELO' "$($disco.name) [$($disco.resourceGroup)]" `
                "disco $($disco.diskSizeGb) GB anexado - cobra junto com a VM" `
                'some junto com o grupo de recursos'
        }
    }
    if (@($vms).Count -eq 0 -and $discos.Count -eq 0) { Write-Host '   nenhum' -ForegroundColor Green }

    # ---- 6. Azure SQL ------------------------------------------------------
    # O free offer (useFreeLimit) e o unico jeito de ter SQL gerenciado a R$ 0.
    Escrever-Secao 'Azure SQL'
    $servidores = Invocar-Az "az sql server list --subscription $id -o json"
    if (-not $servidores) {
        Write-Host '   nenhum' -ForegroundColor Green
    } else {
        # O Synapse cria um Microsoft.Sql/servers proprio, num resource group
        # gerenciado, contendo so o 'master'. Contar bancos de usuario evita
        # reportar esse servidor como se fosse um banco esquecido.
        $bancosDeUsuario = 0
        foreach ($srv in $servidores) {
            $bancos = Invocar-Az "az sql db list --subscription $id -s $($srv.name) -g $($srv.resourceGroup) -o json"
            foreach ($db in @($bancos)) {
                if ($db.name -eq 'master') { continue }
                $bancosDeUsuario++
                if ($db.useFreeLimit) {
                    Registrar 'VERDE' "$($srv.name)/$($db.name)" `
                        "free offer ligado (comportamento: $($db.freeLimitExhaustionBehavior))" 'nada a fazer'
                } else {
                    Registrar 'VERMELHO' "$($srv.name)/$($db.name)" `
                        "SKU $($db.currentServiceObjectiveName) FORA do free offer - cobra por hora" `
                        'recriar com --use-free-limit, ou apagar'
                }
            }
        }
        if ($bancosDeUsuario -eq 0) {
            Write-Host '   nenhum banco de usuario (so o master dos servidores gerenciados)' -ForegroundColor Green
        }
    }

    # ---- 7. Logic Apps ----------------------------------------------------
    # Consumption cobra por acao E por verificacao de gatilho. Um polling de
    # 1 min sao ~43.000 verificacoes/mes cobradas mesmo sem nada acontecer.
    Escrever-Secao 'Logic Apps'
    $logics = Invocar-Az "az resource list --subscription $id --resource-type Microsoft.Logic/workflows -o json"
    if (-not $logics) {
        Write-Host '   nenhum' -ForegroundColor Green
    } else {
        foreach ($l in @($logics)) {
            $urlBase = "https://management.azure.com$($l.id)"
            $wf   = Invocar-Az "az rest --method get --url ""$urlBase`?api-version=2019-05-01"" -o json"
            # Sem $top na URL de proposito: como o comando passa por
            # Invoke-Expression, '$top' seria expandido como variavel do
            # PowerShell (vazia) e a URL chegaria quebrada em '&=5'.
            $runs = Invocar-Az "az rest --method get --url ""$urlBase/runs`?api-version=2019-05-01"" -o json"

            # O intervalo do gatilho e o que determina o custo de polling:
            # 1 min = ~43.200 verificacoes/mes; 15 min = ~2.880.
            $intervalo = $null
            $frequencia = $null
            if ($wf) {
                foreach ($t in $wf.properties.definition.triggers.PSObject.Properties) {
                    if ($t.Value.recurrence) {
                        $intervalo  = $t.Value.recurrence.interval
                        $frequencia = $t.Value.recurrence.frequency
                    }
                }
            }
            $qtdRuns = if ($null -ne $runs) { @($runs.value).Count } else { -1 }

            $descricao = "Consumption - cobra por acao E por verificacao de gatilho"
            if ($intervalo) {
                $porMes = switch ($frequencia) {
                    'Minute' { [int](43200 / $intervalo) }
                    'Hour'   { [int](720   / $intervalo) }
                    'Day'    { [int](30    / $intervalo) }
                    default  { 0 }
                }
                $descricao += " | polling a cada $intervalo $frequencia = ~$porMes verificacoes/mes"
            }

            # Zero execucao + polling agressivo = pagando para nada acontecer.
            # Foi o caso encontrado aqui: 4 meses de polling de 1 min, 0 disparos.
            if ($qtdRuns -eq 0) {
                Registrar 'VERMELHO' "$($l.name) [$($l.resourceGroup)]" `
                    "$descricao | ZERO execucoes - esta pagando polling sem nunca ter disparado" `
                    "aumentar o intervalo do gatilho, ou desativar: az logic workflow update -n $($l.name) -g $($l.resourceGroup) --state Disabled"
            } elseif ($qtdRuns -lt 0) {
                Registrar 'AMARELO' "$($l.name) [$($l.resourceGroup)]" `
                    "$descricao | historico de execucoes indisponivel" `
                    'conferir as execucoes no portal'
            } else {
                Registrar 'AMARELO' "$($l.name) [$($l.resourceGroup)]" `
                    "$descricao | $qtdRuns execucao(oes) no historico" `
                    'se o polling for mais frequente que a chegada real de dados, aumente o intervalo'
            }
        }
    }

    # ---- 8. Custo do mes --------------------------------------------------
    if (-not $SemCusto) {
        Escrever-Secao 'Custo do mes (Cost Management)'

        $corpo = @{
            type      = 'ActualCost'
            timeframe = 'MonthToDate'
            dataset   = @{
                granularity = 'None'
                aggregation = @{ total = @{ name = 'Cost'; function = 'Sum' } }
                grouping    = @(@{ type = 'Dimension'; name = 'ServiceName' })
            }
        } | ConvertTo-Json -Depth 10 -Compress

        # A API rejeita corpo grande na linha de comando no Windows; arquivo e mais seguro
        $tmp = Join-Path $env:TEMP "custo-$([guid]::NewGuid()).json"
        Set-Content -Path $tmp -Value $corpo -Encoding utf8

        $url = "https://management.azure.com/subscriptions/$id/providers/Microsoft.CostManagement/query?api-version=2023-11-01"
        $r = Invocar-Az "az rest --method post --url ""$url"" --body ""@$tmp"" --headers ""Content-Type=application/json"" -o json"
        Remove-Item $tmp -ErrorAction SilentlyContinue

        if (-not $r) {
            Write-Host '   indisponivel (a Cost Management API limita a ~1 consulta/min e devolve 429)' -ForegroundColor Yellow
            Write-Host '   espere um minuto e rode de novo, ou use -SemCusto' -ForegroundColor DarkGray
        } else {
            $total = 0.0
            foreach ($linha in ($r.properties.rows | Sort-Object { -[double]$_[0] })) {
                $total += [double]$linha[0]
                Write-Host ("   {0,9:N2}  {1}" -f [double]$linha[0], $linha[1]) -ForegroundColor DarkGray
            }
            Write-Host ("   {0,9:N2}  TOTAL" -f $total) -ForegroundColor White
            Write-Host '   (servico "Azure DevOps" = jobs paralelos; NAO some com az group delete)' -ForegroundColor DarkGray
        }
    }
}

# --------------------------------------------------------------- 9. resumo

Escrever-Titulo 'RESUMO'

$vermelhos = @($script:Achados | Where-Object Nivel -eq 'VERMELHO')
$amarelos  = @($script:Achados | Where-Object Nivel -eq 'AMARELO')

if ($vermelhos.Count -eq 0) {
    Write-Host ''
    Write-Host '  Nenhum recurso de preco fixo encontrado.' -ForegroundColor Green
} else {
    Write-Host ''
    Write-Host ("  {0} item(ns) de PRECO FIXO - cobram parados:" -f $vermelhos.Count) -ForegroundColor Red
    foreach ($a in $vermelhos) {
        Write-Host ''
        Write-Host ("   * {0}" -f $a.Recurso) -ForegroundColor Red
        Write-Host ("     {0}" -f $a.Problema) -ForegroundColor DarkGray
        Write-Host ("     -> {0}" -f $a.Acao) -ForegroundColor Yellow
    }
}

if ($amarelos.Count -gt 0) {
    Write-Host ''
    Write-Host ("  {0} item(ns) com pegadinha de consumo:" -f $amarelos.Count) -ForegroundColor Yellow
    foreach ($a in $amarelos) {
        Write-Host ("   * {0} - {1}" -f $a.Recurso, $a.Problema) -ForegroundColor DarkGray
    }
}

Write-Host ''
Write-Host '  O QUE ESTE SCRIPT NAO VE:' -ForegroundColor Cyan
Write-Host '    Jobs paralelos do Azure DevOps. Nao sao recurso do Azure.' -ForegroundColor DarkGray
Write-Host '    Confira em: dev.azure.com/<org>/_settings/buildqueue?_a=concurrentJobs' -ForegroundColor DarkGray
Write-Host '    Esperado: Monthly purchases = 0 nos dois (MS-hosted e self-hosted)' -ForegroundColor DarkGray
Write-Host ''
Write-Host '    Licenca do Test Plans (~US$ 52/usuario/mes) e usuarios Basic alem dos 5 gratis.' -ForegroundColor DarkGray
Write-Host '    Confira em: dev.azure.com/<org>/_settings/billing' -ForegroundColor DarkGray
Write-Host ''
Write-Host '  Detalhes e como validar cada item: ../custos-desligamento-e-validacao.md' -ForegroundColor DarkGray
Write-Host ''

exit 0
