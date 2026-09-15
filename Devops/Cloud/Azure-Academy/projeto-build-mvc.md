# 🧬 Anatomia do projeto `build_mvc` (AzureAcademy.MVC)

> **Tema:** ASP.NET MVC 5 sobre .NET Framework — a aplicação que serve de cobaia nos labs de Pipelines
> **Pré-requisitos:** noções de C# e HTTP
> **Conceitos base:** padrão MVC · roteamento convencional · Razor · bundling/minification · `Web.config` e transforms · `packages.config` · MSTest
> **Repositório:** [`dev.azure.com/wallisonsousa/AzureAcademy/_git/build_mvc`](https://dev.azure.com/wallisonsousa/AzureAcademy/_git/build_mvc)
> **Curso:** Azure Academy — Azure DevOps & GitHub · usado no Módulo 5

---

## 🎯 O que é este projeto

É o **scaffold padrão do Visual Studio** para "ASP.NET Web Application → MVC, sem autenticação", commitado praticamente intocado. Duas coisas importam sobre ele:

1. **Não tem regra de negócio.** Três páginas estáticas (Home, About, Contact), zero modelo, zero banco, zero autenticação. Isso é proposital — o objeto de estudo do curso **não é a aplicação**, é o que acontece com ela na esteira de CI/CD.
2. **É deliberadamente legado.** .NET Framework 4.6.1, `packages.config`, `Web.config`, bundling do lado do servidor. Isso é o que a maioria das empresas realmente tem em produção — e é onde os problemas de pipeline aparecem de verdade (foi exatamente o caso do [lab-05](lab-05-pipelines-build-classica.md)).

**Histórico completo do repositório: dois commits.**

| Commit | Data | Mensagem |
|---|---|---|
| `1f642f51` | 10/03/2025 | `Added README.md` |
| `5e53b206` | 10/03/2025 | `teste2` |

O `README.md` é o template do Azure Repos, com os `TODO:` originais nunca preenchidos. Ou seja: **todo o código veio de um único commit**, gerado pelo Visual Studio.

---

## 🗂️ Anatomia

```
build_mvc/
├─ AzureAcademy.MVC.sln              ← a solução: 2 projetos
│
├─ AzureAcademy.MVC/                 ← a aplicação web
│  ├─ Global.asax(.cs)               ← ponto de entrada do processo
│  ├─ App_Start/
│  │  ├─ RouteConfig.cs              ← URL → controller/action
│  │  ├─ FilterConfig.cs             ← filtros globais (HandleError)
│  │  └─ BundleConfig.cs             ← agrupa e minifica JS/CSS
│  ├─ Controllers/
│  │  └─ HomeController.cs           ← 3 actions, nada mais
│  ├─ Views/
│  │  ├─ _ViewStart.cshtml           ← define o layout padrão
│  │  ├─ Shared/_Layout.cshtml       ← o "template" HTML
│  │  ├─ Shared/Error.cshtml
│  │  ├─ Home/{Index,About,Contact}.cshtml
│  │  └─ Web.config                  ← config SÓ do motor Razor
│  ├─ Content/                       ← CSS (bootstrap 3.3.7 + Site.css)
│  ├─ Scripts/                       ← jQuery 3.3.1, validation, modernizr
│  ├─ fonts/                         ← glyphicons do bootstrap
│  ├─ Web.config                     ← config da aplicação
│  ├─ Web.Debug.config
│  ├─ Web.Release.config             ← transform de Release
│  └─ packages.config                ← 16 dependências NuGet
│
└─ AzureAcademy.MVC.Tests/           ← testes unitários
   ├─ Controllers/HomeControllerTest.cs
   ├─ App.config
   └─ packages.config                ← MSTest 1.2.0
```

> 💡 **`App_Start/` não é mágica.** O nome é convenção do template, não do framework. Quem chama essas classes é o `Application_Start()` do `Global.asax.cs`, explicitamente. Se você renomear a pasta e ajustar o `using`, nada quebra.

---

## 🔀 Como uma requisição atravessa a aplicação

Pedindo `GET /Home/About`:

```
1. IIS  ─────────────► ASP.NET recebe a requisição
2. Global.asax   Application_Start() já rodou UMA vez, no start do processo:
                   ├─ AreaRegistration.RegisterAllAreas()
                   ├─ FilterConfig.RegisterGlobalFilters()   → HandleErrorAttribute
                   ├─ RouteConfig.RegisterRoutes()           → tabela de rotas
                   └─ BundleConfig.RegisterBundles()         → bundles de JS/CSS
3. RouteConfig   casa "Home/About" com "{controller}/{action}/{id}"
                   → controller = "Home", action = "About", id = ausente
4. MvcHandler    instancia HomeController, chama About()
5. HomeController.About()
                   ViewBag.Message = "Your application description page."
                   return View();          ← sem nome ⇒ procura a view "About"
6. Razor         Views/_ViewStart.cshtml define Layout = "~/Views/Shared/_Layout.cshtml"
                   renderiza Views/Home/About.cshtml DENTRO do layout
7. BundleConfig  o layout pede @Scripts.Render("~/bundles/jquery") etc.
                   → em Release, entrega 1 arquivo minificado com hash de versão
8. HTTP 200      HTML pronto
```

> 🔑 **O passo 5 é a convenção central do MVC.** `return View()` sem argumento procura uma view com o **nome da action**, na pasta com o **nome do controller** (`Views/Home/About.cshtml`), com fallback para `Views/Shared/`. Nada disso está escrito em lugar nenhum — é convenção sobre configuração.

---

## 🧩 Peça por peça

### `Global.asax.cs` — o único ponto de entrada

```csharp
public class MvcApplication : System.Web.HttpApplication
{
    protected void Application_Start()
    {
        AreaRegistration.RegisterAllAreas();
        FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
        RouteConfig.RegisterRoutes(RouteTable.Routes);
        BundleConfig.RegisterBundles(BundleTable.Bundles);
    }
}
```

Roda **uma vez por processo**, não por requisição. É o equivalente do `Program.cs` / `Startup.cs` do ASP.NET Core — só que sem injeção de dependência e com estado global (`RouteTable.Routes`, `BundleTable.Bundles` são estáticos).

### `RouteConfig.cs` — roteamento por convenção

```csharp
routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

routes.MapRoute(
    name: "Default",
    url: "{controller}/{action}/{id}",
    defaults: new { controller = "Home", action = "Index", id = UrlParameter.Optional }
);
```

Uma rota só. Consequências práticas:

| URL | Resolve para |
|---|---|
| `/` | `HomeController.Index()` — pelos defaults |
| `/Home` | `HomeController.Index()` |
| `/Home/About` | `HomeController.About()` |
| `/Home/About/42` | `HomeController.About()` — o `42` é ignorado, a action não tem parâmetro |
| `/Produtos` | **404** — não existe `ProdutosController` |

O `IgnoreRoute("{resource}.axd/...")` existe para os *handlers* legados do WebForms (`WebResource.axd`, `ScriptResource.axd`) não caírem no MVC.

### `HomeController.cs` — o mínimo possível

```csharp
public class HomeController : Controller
{
    public ActionResult Index()   => View();
    public ActionResult About()   { ViewBag.Message = "Your application description page."; return View(); }
    public ActionResult Contact() { ViewBag.Message = "Your contact page.";                 return View(); }
}
```

`ViewBag` é `dynamic` — resolvido em **tempo de execução**, sem verificação do compilador. Errar o nome (`ViewBag.Mesage`) compila normalmente e renderiza vazio. É justamente o tipo de bug que o teste do `About()` pega.

### `BundleConfig.cs` — bundling e minificação do lado do servidor

```csharp
bundles.Add(new ScriptBundle("~/bundles/jquery").Include("~/Scripts/jquery-{version}.js"));
bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include("~/Scripts/jquery.validate*"));
bundles.Add(new ScriptBundle("~/bundles/modernizr").Include("~/Scripts/modernizr-*"));
bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include("~/Scripts/bootstrap.js"));
bundles.Add(new StyleBundle("~/Content/css").Include("~/Content/bootstrap.css", "~/Content/site.css"));
```

Este é o **webpack de 2013**, embutido no framework:

- `{version}` e `*` são curingas — resolvidos em runtime pelos arquivos que existirem em disco. Atualizar o jQuery de `3.3.1` para `3.7.x` não exige tocar nesse arquivo.
- Em **Debug** (`debug="true"` no `Web.config`), cada arquivo vai separado, legível, para você depurar.
- Em **Release**, tudo vira **um** arquivo minificado com um **hash na querystring** (`?v=abc123`). O hash muda quando o conteúdo muda — é cache busting automático.

> ⚠️ Repare em `"~/Content/site.css"` (minúsculo) enquanto o arquivo é `Content/Site.css`. Funciona no Windows porque o sistema de arquivos é *case-insensitive*. **Num contêiner Linux, quebraria.** É uma armadilha real ao migrar app Framework para Linux/Kestrel.

### `Web.config` — a configuração da aplicação

```xml
<add key="webpages:Version" value="3.0.0.0"/>
<add key="webpages:Enabled" value="false"/>
<add key="ClientValidationEnabled" value="true"/>
<add key="UnobtrusiveJavaScriptEnabled" value="true"/>

<compilation debug="true" targetFramework="4.6.1"/>
<httpRuntime targetFramework="4.6.1"/>
```

| Chave | Para quê |
|---|---|
| `webpages:Enabled = false` | Impede que arquivos `.cshtml` sejam servidos **diretamente** pela URL. Sem isso, `/Views/Home/About.cshtml` seria acessível burlando o controller |
| `ClientValidationEnabled` + `UnobtrusiveJavaScriptEnabled` | Ligam a validação no navegador via `data-val-*`, feita pelo `jquery.validate.unobtrusive` |
| `compilation debug` | Em `true`: sem otimização, bundles separados, símbolos completos. **Nunca deve ir para produção** — degrada desempenho e vaza stack traces |
| `httpRuntime targetFramework` | Define o **modo de compatibilidade** (quirks) do runtime, independente do alvo de compilação |

O `debug="true"` está commitado, mas isso é seguro **por causa do transform**:

```xml
<!-- Web.Release.config -->
<compilation xdt:Transform="RemoveAttributes(debug)" />
```

Quando o pacote é gerado em `Release`, o atributo `debug` é **removido** do `Web.config` final. É o mecanismo XDT — o antecessor dos `appsettings.{Environment}.json` do .NET Core.

> 🔑 **Só que o transform depende do build ser Release.** É exatamente por isso que a variável `BuildConfiguration=Release` da pipeline ([lab-05](lab-05-pipelines-build-classica.md)) não é detalhe cosmético: com `Debug`, o pacote publicado sairia com `debug="true"`.

### `Views/Web.config` — o segundo `Web.config`

A pasta `Views/` tem um `Web.config` próprio. Ele **não configura a aplicação** — configura o **motor Razor**: `using` implícitos das views, o handler que bloqueia acesso direto aos `.cshtml`, e a versão do `System.Web.WebPages.Razor`. Editar o errado dos dois é um clássico de perda de tempo.

---

## 🧪 Os testes

`AzureAcademy.MVC.Tests/Controllers/HomeControllerTest.cs` — **MSTest 1.2.0**, três métodos:

```csharp
[TestClass]
public class HomeControllerTest
{
    [TestMethod]
    public void Index()
    {
        HomeController controller = new HomeController();          // Arrange
        ViewResult result = controller.Index() as ViewResult;      // Act
        Assert.IsNotNull(result);                                  // Assert
    }

    [TestMethod]
    public void About()
    {
        HomeController controller = new HomeController();
        ViewResult result = controller.About() as ViewResult;
        Assert.AreEqual("Your application description page.", result.ViewBag.Message);
    }

    [TestMethod]
    public void Contact() { /* igual ao Index */ }
}
```

**O que estes testes realmente provam — e o que não provam:**

| Teste | Prova | Não prova |
|---|---|---|
| `Index` / `Contact` | Que a action retorna um `ViewResult` e não `null` | Que a view **existe**, que renderiza, que a rota chega lá |
| `About` | Que `ViewBag.Message` recebe o texto certo | O mesmo acima |

São testes de **unidade pura**: instanciam o controller com `new`, sem `HttpContext`, sem servidor. Rodam em milissegundos e são o piso da pirâmide. O que falta é a camada de cima — um teste de integração que suba a app e faça `GET /Home/About` de verdade, provando que rota + view + layout funcionam juntos.

> 💡 **Por que o `About` é o mais valioso dos três.** Ele é o único que verifica **comportamento**, não apenas ausência de `null`. E como `ViewBag` é `dynamic`, um erro de digitação em `ViewBag.Message` não é pego pelo compilador — só por este teste.

Na pipeline, esses três rodam na task **VsTest**, e é de onde vem o `100% passed` do run #5.

---

## 📦 Dependências

**Aplicação — 16 pacotes** (todos `targetFramework="net461"`):

| Pacote | Versão | Papel |
|---|---|---|
| `Microsoft.AspNet.Mvc` | 5.2.4 | O framework MVC |
| `Microsoft.AspNet.Razor` | 3.2.4 | Motor de views |
| `Microsoft.AspNet.WebPages` | 3.2.4 | Base do Razor |
| `Microsoft.AspNet.Web.Optimization` | 1.1.3 | Bundling/minificação |
| `WebGrease` + `Antlr` | 1.6.0 / 3.5.0.2 | Minificadores usados pelo Optimization |
| `Microsoft.CodeDom.Providers.DotNetCompilerPlatform` | 2.0.0 | Compila as views com **Roslyn** em vez do compilador antigo |
| `Newtonsoft.Json` | 11.0.1 | Serialização |
| `bootstrap` / `jQuery` / `jQuery.Validation` / `Modernizr` | 3.3.7 / 3.3.1 / 1.17.0 / 2.8.3 | Front-end |
| `Microsoft.jQuery.Unobtrusive.Validation` | 3.2.4 | Ponte validação server → `data-val-*` |
| `System.Diagnostics.DiagnosticSource` · `Microsoft.AspNet.TelemetryCorrelation` · `Microsoft.Web.Infrastructure` | — | Infra/telemetria |

**Testes — 7 pacotes**, dos quais os que importam: `MSTest.TestFramework` e `MSTest.TestAdapter`, ambos **1.2.0**.

### O que é `packages.config` (e por que ele dói)

É o formato **antigo** de referência NuGet, anterior ao `PackageReference`. Duas diferenças que mudam tudo:

| | `packages.config` (aqui) | `PackageReference` (moderno) |
|---|---|---|
| Onde ficam as referências | **Duplicadas**: no `packages.config` **e** como `<Reference>` com `<HintPath>` no `.csproj` | Só no `.csproj` |
| Dependências transitivas | **Achatadas** no arquivo — você vê `Antlr` porque `WebGrease` precisa dele | Resolvidas na hora, não listadas |
| Restauração | Baixa para `packages/` **ao lado da solução** | Cache global em `~/.nuget/packages` |

Consequência prática: **atualizar um pacote exige mexer em dois lugares**, e um `<HintPath>` desatualizado quebra o build com erro de assembly não encontrado — sem nenhuma pista de que a culpa é do NuGet.

É também o motivo de a pipeline ter uma task **`NuGet restore`** separada antes do build: com `packages.config`, o MSBuild **não** restaura sozinho.

### Os `bindingRedirect`

O `Web.config` tem sete deles:

```xml
<dependentAssembly>
  <assemblyIdentity name="Newtonsoft.Json" publicKeyToken="30ad4fe6b2a6aeed"/>
  <bindingRedirect oldVersion="0.0.0.0-11.0.0.0" newVersion="11.0.0.0"/>
</dependentAssembly>
```

Tradução: *"qualquer assembly que peça uma versão do Newtonsoft.Json entre 0.0.0.0 e 11.0.0.0, entregue a 11.0.0.0"*.

Existem porque o .NET Framework faz **binding forte de versão**: se a lib A foi compilada contra Newtonsoft 9 e você tem a 11 em disco, o carregamento falha em runtime com `FileLoadException` — **não** em tempo de compilação. O redirect é o remendo oficial. O .NET Core acabou com essa categoria inteira de problema.

---

## 🏗️ Do código ao artefato

O que a pipeline `AzureAcademy-CI` faz com este repositório:

```
Checkout build_mvc@main
   └─ NuGet restore                     ← packages.config exige passo próprio
        └─ msbuild AzureAcademy.MVC.sln
             /p:configuration=Release       → aplica Web.Release.config
             /p:platform="Any CPU"
             /p:TargetFrameworkVersion=v4.8 ← paliativo: agente não tem o pack do 4.6.1
             /p:DeployOnBuild=true          → gera pacote de Web Deploy
             /p:WebPublishMethod=Package
             /p:PackageAsSingleFile=true    → tudo num .zip só
             /p:PackageLocation="$(Build.ArtifactStagingDirectory)\\"
                  └─ VsTest                 ← roda os 3 testes MSTest
                       └─ Publish Artifact: drop  → 9,1 MB
```

O `drop` de 9,1 MB é o **pacote de Web Deploy**: um `.zip` com a app compilada, o `Web.config` já transformado, os `Content/`, `Scripts/` e `fonts/`, mais os arquivos de manifesto que o MSDeploy usa para publicar num App Service.

> 🔑 **A app tem ~600 linhas de código próprio e o pacote tem 9,1 MB.** A esmagadora maioria é `Scripts/` e `Content/` — bootstrap e jQuery em versão completa, minificada, e ainda os `.map`. Todos commitados no repositório, porque é assim que o `packages.config` funciona: o NuGet **copia** os arquivos de conteúdo para dentro do projeto.

O diagnóstico completo de por que essa pipeline estava vermelha está no **[lab-05](lab-05-pipelines-build-classica.md)**.

---

## ⚠️ O que este projeto tem de datado

Útil saber, porque é o que você vai encontrar em código legado real:

| Coisa | Situação hoje | Substituto moderno |
|---|---|---|
| .NET Framework 4.6.1 | Fora de suporte (o 4.6.2 é o mínimo suportado) | .NET 8/9 |
| `packages.config` | Legado; VS já nem oferece | `PackageReference` |
| `Web.config` + XDT transforms | Só existe no Framework | `appsettings.json` + variáveis de ambiente |
| Bundling do `System.Web.Optimization` | Descontinuado | Vite / webpack / esbuild |
| `Global.asax` | — | `Program.cs` com DI e middleware |
| jQuery 3.3.1 (2018) · Bootstrap 3.3.7 (2016) | Ambos com CVEs conhecidos | Versões atuais |
| MSTest 1.2.0 (2017) | — | MSTest 3.x, xUnit ou NUnit |
| `ViewBag` (`dynamic`) | Funciona, sem checagem de tipo | ViewModel tipado |
| Scripts e CSS commitados no repo | — | Gerenciador de pacotes front-end |

> 💡 **Nada disso impede o projeto de servir ao propósito dele.** Ele existe para ter algo real para compilar, testar e publicar. Mas saber o que é ruído histórico e o que é decisão de arquitetura é metade da leitura de um código legado.

---

## 🐞 Troubleshooting Comum

| Sintoma | Causa provável | Onde olhar |
|---|---|---|
| `MSB3644 ... reference assemblies ... v4.6.1 ... not found` | Targeting pack ausente na máquina/agente | `<TargetFrameworkVersion>` nos dois `.csproj` — ver [lab-05](lab-05-pipelines-build-classica.md) |
| Build local OK, CI quebra | Pacotes restaurados em `packages/` localmente e ausentes no agente | A task `NuGet restore` rodou? |
| `FileLoadException: Could not load file or assembly ... Version=x.y` | `bindingRedirect` faltando ou desatualizado | `<runtime><assemblyBinding>` do `Web.config` |
| Página em branco e `ViewBag` vazio | Erro de digitação no nome da propriedade | `ViewBag` é `dynamic` — o compilador não avisa |
| CSS/JS não carrega em produção mas funciona local | Curinga de bundle sem match, ou diferença de maiúsculas | `BundleConfig.cs` — `site.css` vs `Site.css` |
| Stack trace exposto em produção | `debug="true"` sobreviveu ao deploy | Build foi em `Debug`? O transform de Release não rodou |
| `The view 'X' was not found` | View fora de `Views/{Controller}/` ou de `Views/Shared/` | Convenção de pastas |
| Testes passam mas a página quebra | Testes só verificam o `ViewResult`, não renderizam a view | Falta teste de integração |

---

## 🧠 Conceitos Aprendidos

- **Convenção sobre configuração.** `return View()` acha `Views/Home/About.cshtml` sem que ninguém escreva isso em lugar nenhum. Rápido de escrever, e a razão de erros de nomenclatura só aparecerem em runtime.
- **Duas configurações de framework, com papéis diferentes.** `<TargetFrameworkVersion>` no `.csproj` diz **contra o que compilar**; `<httpRuntime targetFramework>` no `Web.config` diz **em qual modo de compatibilidade executar**. Podem divergir — e no caso desta pipeline, divergem de propósito.
- **`debug="true"` é seguro *porque* existe um transform.** Configuração versionada por ambiente via XDT é o ancestral direto de `appsettings.{Environment}.json`. E depende da configuração de build estar correta.
- **`packages.config` duplica estado.** A mesma dependência aparece no `packages.config` e no `.csproj`. Duplicação sempre acaba divergindo — daí a necessidade da task `NuGet restore` separada.
- **`bindingRedirect` é sintoma de binding forte de versão.** Uma classe de problema que só existe no .NET Framework.
- **Teste de unidade não prova que a página funciona.** `Assert.IsNotNull(result)` prova que a action devolveu algo. Rota, view, layout e bundles ficam todos fora do alcance.
- **O tamanho do artefato revela a arquitetura.** 9,1 MB para ~600 linhas próprias diz que quase tudo é dependência copiada para dentro do repositório.

---

## ✅ Quiz Mental

<details>
<summary>Por que a pipeline precisa de uma task <code>NuGet restore</code> separada, se o MSBuild moderno restaura sozinho?</summary>

Porque este projeto usa **`packages.config`**, não `PackageReference`. O restore automático (`/restore` ou `msbuild -t:restore`) só funciona com `PackageReference`.

Com `packages.config`, os `.csproj` referenciam os assemblies por `<HintPath>` apontando para `..\packages\...`. Se ninguém baixou essa pasta antes, o MSBuild simplesmente não acha os arquivos e falha com erro de referência — sem nunca mencionar NuGet.

</details>

<details>
<summary>O <code>Web.config</code> tem <code>debug="true"</code> commitado. Isso é um bug de segurança?</summary>

**Não, por causa do transform.** O `Web.Release.config` traz:

```xml
<compilation xdt:Transform="RemoveAttributes(debug)" />
```

Ao empacotar em `Release`, o atributo é removido do `Web.config` final.

**Mas vira bug se o build for feito em `Debug`.** Aí o transform de Release não roda e o pacote sai com `debug="true"` — sem otimização e vazando stack trace completo em erro. É exatamente por isso que a variável `BuildConfiguration=Release` da pipeline importa.

</details>

<details>
<summary>Compilar contra 4.8 um projeto que declara 4.6.1 pode quebrar alguma coisa?</summary>

**Na prática, quase nunca** — o .NET Framework 4.x é uma instalação *in-place*: 4.8 substitui 4.6.1 na máquina, e a compatibilidade para trás é forte.

**Mas há um detalhe.** O `<httpRuntime targetFramework="4.6.1">` continua no `Web.config`, então em runtime a app roda em **modo de quirks 4.6.1** mesmo tendo sido compilada contra 4.8. Compilação e execução ficam em versões diferentes.

Para esta app — três páginas estáticas — é irrelevante. Num sistema grande, é o tipo de divergência que gera bug difícil de reproduzir. A correção limpa é retargetar os `.csproj` **e** o `Web.config` para 4.8 de uma vez.

</details>

<details>
<summary>Os três testes passam. Quanta confiança isso dá de que o site funciona?</summary>

**Pouca.** Eles instanciam `HomeController` com `new`, chamam o método e olham o retorno. Passariam intactos se:

- os arquivos `.cshtml` fossem **apagados** (a view só é procurada na renderização, não no `return View()`)
- o `RouteConfig` estivesse quebrado (nenhuma URL é exercitada)
- o `_Layout.cshtml` tivesse HTML inválido
- os bundles apontassem para arquivos inexistentes

O que falta é um teste de integração que suba a aplicação e faça `GET /Home/About`, verificando status 200 e conteúdo. Os unitários são o piso — úteis e baratos, mas piso.

</details>

<details>
<summary>Por que <code>webpages:Enabled</code> está como <code>false</code>?</summary>

Para impedir que arquivos `.cshtml` sejam servidos **diretamente pela URL**, no estilo do ASP.NET Web Pages (o irmão do MVC, sem controllers).

Com `true`, `/Views/Home/About.cshtml` poderia ser acessado direto — pulando o controller, os filtros globais e qualquer autorização. É um endurecimento por padrão: no MVC, toda requisição **deve** passar por uma action.

</details>

---

## 🗺️ Status do Roadmap

| Item | Estado |
|---|---|
| Entender a estrutura e o fluxo de requisição | ✅ este documento |
| Build verde na pipeline clássica | ✅ [lab-05](lab-05-pipelines-build-classica.md) — run #5 |
| Artefato `drop` publicado (9,1 MB) | ✅ |
| Retargetar os `.csproj` + `Web.config` para 4.8 | 🔜 PR próprio, tira o paliativo |
| Release: publicar o `drop` num App Service | 🔜 depende da [quota](lab-03-repos-azure-devops-github-codespaces.md) |
| Migrar a pipeline para YAML versionado | 🔜 Módulo 5/6 |
| Escrever um teste de integração de verdade | 🔜 |

---

---

## 📚 Leitura complementar

| Livro | Onde | Por quê |
|---|---|---|
| **#01** *Fundamentals of Azure* | cap. 2 — Azure App Service and Web Apps | Onde esta app roda |
| **#09** *Implementing Azure DevOps Solutions* | cap. 5 — Dependency Management | O problema que o `packages.config` representa |

> Acervo completo e critério de uso em **[bibliografia.md](bibliografia.md)**. Os arquivos ficam em `materiais/livros/`, fora do controle de versão.

## 🔗 Conexões

| Tema | Onde |
|---|---|
| A pipeline que compila este projeto | [lab-05 — build clássico](lab-05-pipelines-build-classica.md) |
| Repos, PRs e work items | [lab-03](lab-03-repos-azure-devops-github-codespaces.md) |
| Índice da formação | [README.md](README.md) |
| O contraponto em Node/Express | `meu-hello-app` — ver [lab-03](lab-03-repos-azure-devops-github-codespaces.md) |
| Testes e qualidade | [Devops/TDD](../../TDD/), [Devops/SonarQube](../../SonarQube/) |
| Arquitetura em camadas vs. microsserviços | [Arquitetura-de-Software/Microsservicos](../../../Arquitetura-de-Software/Microsservicos/) |

---

## 💡 Reflexão Final

A tentação, olhando este repositório, é descartá-lo: é um scaffold, tem três páginas, o README ainda tem os `TODO:` do template. Mas ele ensina uma coisa que projeto novo não ensina — **como um sistema legado se comporta numa esteira moderna**.

Todos os problemas do [lab-05](lab-05-pipelines-build-classica.md) nasceram daqui: o `v4.6.1` num agente que não tem mais o pack; o `NuGet restore` separado que o `packages.config` exige; o `BuildConfiguration` que precisa ser `Release` para o transform do `Web.config` rodar. Nenhum é bug do código — são **consequências de decisões de 2018 encontrando ferramentas de 2026**.

E é essa a habilidade que o Módulo 5 realmente treina. Criar pipeline para projeto novo é preencher formulário. Fazer um projeto legado passar por ela exige entender as duas pontas: o que a esteira espera, e o que o código tem para oferecer.
