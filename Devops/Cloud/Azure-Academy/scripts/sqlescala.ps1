<#
    Runbook 'sqlescala' - Azure Automation, PowerShell 5.1

    Escala um Azure SQL Database via T-SQL (ALTER DATABASE ... MODIFY).
    Baseado no script do Modulo 6 da Azure Academy, com uma mudanca:
    a senha NAO fica no codigo - vem de uma variavel criptografada da
    Automation Account. Runbook e legivel por qualquer pessoa com acesso
    a conta, entao credencial em texto puro aqui e vazamento por design.

    Os placeholders __SERVIDOR__ / __DATABASE__ / __USUARIO__ sao
    substituidos pelo provisionar-lab-azure.ps1 antes do upload.

    ATENCAO - CUSTO:
      Os valores de EDITION/SERVICE_OBJECTIVE abaixo sao do modelo DTU
      (basic / standard / premium). Se o banco estiver na OFERTA GRATUITA
      (vCore Serverless com free limit), rodar isso TIRA o banco do free
      tier de forma PERMANENTE - e so ha um banco gratuito por assinatura.

      Para testar sem custo, escale dentro do proprio serverless:
        SERVICE_OBJECTIVE = 'GP_S_Gen5_4'
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("basic","standard","premium","premiumrs")]
    [string]$EDITION,

    [Parameter(Mandatory=$true)]
    [ValidateSet('basic','S0','S1','S2','S3','P1','P2','P3','P4','P6','P11','P15','PRS1','PRS2','PRS4','PRS6')]
    [string]$SERVICE_OBJECTIVE,

    [Parameter(Mandatory=$false)]
    [string]$DBSIZE = "250GB"
)

$SERVIDOR      = "__SERVIDOR__"
$Database      = "__DATABASE__"
$SqlUsername   = "__USUARIO__"
$SqlPass       = Get-AutomationVariable -Name 'SqlPass'
$SqlServerPort = "1433"

# Conexao
$Conn = New-Object System.Data.SqlClient.SqlConnection(
    "Server=tcp:$SERVIDOR,$SqlServerPort;Database=$Database;User ID=$SqlUsername;Password=$SqlPass;Trusted_Connection=False;Encrypt=True;Connection Timeout=30;"
)
$Conn.Open()

# Comando de escala
$Query = ("ALTER DATABASE {0} MODIFY (EDITION='{1}', SERVICE_OBJECTIVE='{2}', MAXSIZE={3})" -f `
          $Database, $EDITION, $SERVICE_OBJECTIVE, $DBSIZE)
Write-Output $Query

$Cmd = New-Object System.Data.SqlClient.SqlCommand($Query, $Conn)
$Cmd.CommandTimeout = 120

$Ds = New-Object System.Data.DataSet
$Da = New-Object System.Data.SqlClient.SqlDataAdapter($Cmd)
[void]$Da.Fill($Ds)

$Ds.Tables.Column1
$Conn.Close()
