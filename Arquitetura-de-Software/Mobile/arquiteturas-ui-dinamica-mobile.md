# Arquiteturas de UI Dinâmica para Mobile

### Server-Driven UI · Micro Front-ends · Atualizações Over-The-Air (OTA)

> Documento técnico baseado na análise dos projetos `server-driven-ui`, `app-OTA`, `server-OTA` e `app-web`.
> Foco principal: **mobile**. Objetivo: explicar o que cada arquitetura faz, como funciona em cada tecnologia mobile e como implementar.

---

## Sumário

1. [Introdução: o problema do ciclo de release](#1-introdução-o-problema-do-ciclo-de-release)
2. [As três arquiteturas e como se relacionam](#2-as-três-arquiteturas-e-como-se-relacionam)
3. [Server-Driven UI (SDUI) em profundidade](#3-server-driven-ui-sdui-em-profundidade)
4. [SDUI em cada tecnologia mobile](#4-sdui-em-cada-tecnologia-mobile)
5. [Micro Front-ends para Mobile](#5-micro-front-ends-para-mobile)
6. [Atualizações OTA](#6-atualizações-ota-over-the-air)
7. [Combinando as três arquiteturas](#7-combinando-as-três-arquiteturas)
8. [Guia de implementação passo a passo](#8-guia-de-implementação-passo-a-passo)
9. [Políticas das App Stores (regras da Apple e Google)](#9-políticas-das-app-stores)
10. [Boas práticas, armadilhas e segurança](#10-boas-práticas-armadilhas-e-segurança)
11. [Matriz de decisão](#11-matriz-de-decisão-quando-usar-o-quê)
12. [Glossário e referências](#12-glossário-e-referências)

---

## 1. Introdução: o problema do ciclo de release

Aplicativos mobile nativos têm um gargalo estrutural que aplicações web não têm: **toda mudança de interface ou lógica precisa passar por um novo build, pela revisão da App Store / Google Play e pela atualização manual ou automática do usuário.**

Isso cria três dores recorrentes:

- **Lentidão** — corrigir um texto, trocar um banner ou reordenar uma seção pode levar dias (revisão da Apple) e ainda depende do usuário atualizar.
- **Fragmentação de versões** — em qualquer momento existem N versões do app rodando "na mão" dos usuários, cada uma com layout diferente.
- **Risco** — um bug em produção só é corrigido no próximo ciclo de release.

As três arquiteturas deste documento atacam exatamente esse gargalo, cada uma em um nível diferente:

| Arquitetura | O que move para fora do build | Pergunta que responde |
|---|---|---|
| **Server-Driven UI** | *O quê* renderizar (layout, conteúdo, ordem, tema) | "Como mudar a tela sem novo deploy do app?" |
| **Micro Front-ends** | *Quem* constrói cada parte (times/módulos independentes) | "Como vários times entregarem partes do app de forma independente?" |
| **OTA Updates** | *O código* da camada de apresentação (bundle JS/web/Dart) | "Como entregar correções e features sem passar pela loja?" |

Os projetos analisados materializam isso:

```
┌────────────────────────────────────────────────────────────────────────┐
│                         FAMÍLIA OTA-DRIVE                                │
├──────────────────────┬──────────────────────┬──────────────────────────┤
│  server-driven-ui    │  app-OTA             │  server-OTA               │
│  (SDUI)              │  (App mobile)        │  (Distribuição OTA)       │
│                      │                      │                           │
│  Dashboard ─► JSON   │  Ionic + Capacitor   │  Next.js na Vercel        │
│  validado por Zod ─► │  baixa bundle web,   │  serve bundle.zip +       │
│  Renderer monta UI   │  valida e aplica     │  assina HMAC + manifest   │
└──────────────────────┴──────────────────────┴──────────────────────────┘
        SDUI                  OTA (cliente)            OTA (servidor)
```

> **Nota mental para o resto do documento:** SDUI muda *dados de layout*; OTA muda *o código/bundle*; Micro Front-ends muda *a unidade de entrega*. Eles são complementares e frequentemente usados juntos.

---

## 2. As três arquiteturas e como se relacionam

### 2.1 O espectro do "dinamismo"

Pense numa régua, do mais estático (tudo no binário) ao mais dinâmico (tudo no servidor):

```
ESTÁTICO ◄──────────────────────────────────────────────────────────► DINÂMICO

 App 100%      Remote      Feature      OTA do        Server-Driven    UI 100%
 nativo        Config      Flags        bundle JS     UI (SDUI)        remota
 (build)       (valores)   (liga/       (CodePush,    (layout vem      (servidor
               remotos     desliga)     Shorebird,    como JSON)       desenha
                                        Capgo)                         cada pixel)
```

- **Remote Config / Feature Flags** — o servidor controla *valores e chaves* (cor primária, "mostrar promoção?"). O layout já existe no app.
- **OTA do bundle** — o servidor entrega *novo código* da camada web/JS, mas a estrutura de telas continua sendo programada.
- **SDUI** — o servidor entrega a *descrição da tela* (quais seções, em que ordem, com que conteúdo). O app só sabe *como* desenhar cada tipo.
- **UI 100% remota** — caso extremo; raramente vale a pena (latência, offline ruim).

A maioria dos produtos sérios vive **no meio**: estrutura nativa + SDUI nas áreas que mudam muito (home, feed, promoções) + OTA para corrigir a camada de apresentação rápido.

### 2.2 Tabela comparativa

| Critério | Server-Driven UI | Micro Front-ends | OTA Updates |
|---|---|---|---|
| **Granularidade** | Tela / seção / componente | Módulo / mini-app / domínio | Bundle inteiro da camada de apresentação |
| **Quem muda** | Operador/PM via dashboard | Times de engenharia independentes | Engenharia (CI/CD) |
| **Precisa de novo build?** | Não (muda só o JSON) | Não para o host; sim para publicar o módulo | Não (entrega bundle) |
| **Pode adicionar lógica nova?** | Limitado ao que os componentes registrados permitem | Sim (cada módulo é código) | Sim (é código), dentro dos limites da plataforma |
| **Risco de rejeição na loja** | Baixíssimo (são só dados) | Médio (depende de como o código chega) | Médio/alto (depende da política — ver §9) |
| **Complexidade de infra** | Média (backend + contrato + renderer) | Alta (orquestração, versionamento de módulos) | Média (servidor de bundles + verificação) |
| **No projeto analisado** | `server-driven-ui` | (conceito — ver §5) | `app-OTA` + `server-OTA` |

### 2.3 A fronteira entre elas (importante não confundir)

- **SDUI não é "baixar código".** Ele baixa *dados*. O componente `hero_banner` já existe compilado no app; o servidor só diz "renderize um hero_banner com este texto e esta imagem".
- **OTA não é SDUI.** OTA troca *o código* da camada de apresentação (no caso do `app-OTA`, o conteúdo da pasta `www/` — HTML/JS/CSS). É mais poderoso (muda lógica) e mais arriscado (regras de loja).
- **Micro Front-ends é uma estratégia organizacional/de entrega**, frequentemente *implementada por cima* de SDUI ou OTA. Um "mini-app" pode ser entregue como um bundle OTA, e dentro dele ainda usar SDUI.

---

## 3. Server-Driven UI (SDUI) em profundidade

> Toda esta seção é fundamentada no projeto `server-driven-ui` (monorepo Nx: `apps/api` Fastify + Drizzle/SQLite, `apps/web` React/Vite, `libs/shared` com schemas Zod). O exemplo de referência é uma home estilo Spotify.

### 3.1 Os quatro princípios (do `SPEC.md` do projeto)

| Princípio | Descrição | Onde aparece no código |
|---|---|---|
| **Schema-first** | Todo componente tem um `type` registrado no servidor *e* um renderer correspondente no cliente. | `sectionTypeSchema` (Zod) ↔ `registry.ts` |
| **Config ≠ Code** | Textos, imagens, ordem e visibilidade vivem no banco; o código só sabe *como* renderizar cada `type`. | tabela `sections` ↔ componentes em `sdui/components/` |
| **Fail-safe** | `type` desconhecido ou props inválidas → fallback visual + log, **sem quebrar a página inteira**. | `UnknownFallback.tsx` + `parseSectionProps` |
| **Preview** | O dashboard mostra preview em tempo real antes de publicar. | `buildDraftPreview()` + rota `/preview` |

### 3.2 A anatomia de um sistema SDUI

Todo SDUI tem cinco peças. Mapeando para o projeto:

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ 1. CONTRATO │──►│ 2. BACKEND   │──►│ 3. TRANSPORTE│──►│ 4. REGISTRY  │──►│ 5. RENDERER  │
│  (schema)   │   │  (monta JSON)│   │  (HTTP/JSON) │   │ type→component│   │ (monta a UI) │
└─────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
  Zod em            screen-builder.ts   GET /screens/    registry.ts        ScreenRenderer +
  libs/shared       publishScreen()     :slug            (map)              SectionRenderer
```

### 3.3 Peça 1 — O contrato (schema-first com Zod)

O coração do SDUI é o **contrato compartilhado** entre servidor e cliente. No projeto ele vive em `libs/shared/src/sdui-schema.ts` e usa Zod, então **o mesmo schema valida no backend e no frontend** (defesa em profundidade):

```typescript
// libs/shared/src/sdui-schema.ts  (trecho real)

export const sectionTypeSchema = z.enum([
  'hero_banner',
  'album_carousel',
  'playlist_grid',
  'promo_card',
  'text_block',
]);

export const heroBannerPropsSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  backgroundImage: z.string().url().optional(),
  cta: z.object({ label: z.string().min(1), href: z.string().min(1) }).optional(),
});

// A seção é uma UNIÃO DISCRIMINADA por `type` — isso garante que cada
// type só aceita as props certas. Inválido em um campo → erro 422 com detalhe.
export const sectionConfigSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().uuid(),
    type: z.literal('hero_banner'),
    enabled: z.boolean(),
    props: heroBannerPropsSchema,
  }),
  /* ... album_carousel, playlist_grid, promo_card, text_block ... */
]);

export const screenConfigSchema = z.object({
  version: z.number().int().positive(),
  slug: z.string().min(1),
  title: z.string().min(1),
  theme: screenThemeSchema.optional(),
  sections: z.array(sectionConfigSchema),
});
```

O payload final que o app recebe (`ScreenConfig`) é simplesmente:

```jsonc
{
  "version": 3,
  "slug": "home",
  "title": "Home",
  "theme": { "preset": "spotify", "primaryColor": "#1DB954", "backgroundColor": "#121212" },
  "sections": [
    { "id": "…", "type": "hero_banner",    "enabled": true,  "props": { "headline": "Bem-vindo de volta", … } },
    { "id": "…", "type": "album_carousel", "enabled": true,  "props": { "title": "Em destaque", "items": [ … ] } },
    { "id": "…", "type": "promo_card",     "enabled": false, "props": { … } }   // enabled:false → não renderiza
  ]
}
```

> **Por que união discriminada?** Porque é o que torna o contrato seguro. O `type` é a "chave" que diz qual schema de props aplicar. É exatamente o mesmo conceito que você vai replicar em Swift (`enum` com associated values), Kotlin (`sealed class`) ou Dart (`sealed class` / `freezed`).

### 3.4 Peça 2 — O backend que monta o JSON

O backend tem duas responsabilidades: **CRUD de configuração** (dashboard) e **entrega do snapshot publicado** (app). O projeto separa *draft* de *published* com versionamento imutável:

```typescript
// apps/api/src/services/screen-builder.ts  (resumo da lógica real)

// Ao publicar: monta o config, valida com Zod, incrementa a versão e
// grava um SNAPSHOT IMUTÁVEL em screen_versions.
export async function publishScreen(screenId: string): Promise<ScreenConfig> {
  const config = await buildScreenConfig(screenId);          // junta screen + sections ordenadas
  const newVersion = (latestVersion?.version ?? 0) + 1;
  const publishedConfig = { ...config, version: newVersion };

  const validated = screenConfigSchema.safeParse(publishedConfig);   // valida ANTES de gravar
  if (!validated.success) throw new Error('Invalid screen config');

  await db.insert(screenVersions).values({
    id: uuid(), screenId, version: newVersion,
    config: JSON.stringify(validated.data),                  // snapshot congelado
    publishedAt: now,
  });
  await db.update(screens).set({ status: 'published' }).where(eq(screens.id, screenId));
  return validated.data;
}

// O app sempre recebe a ÚLTIMA versão publicada (nunca o draft em edição):
export async function getPublishedScreenConfig(slug: string): Promise<ScreenConfig | null> {
  const screen = await db.query.screens.findFirst({ where: eq(screens.slug, slug) });
  if (!screen || screen.status !== 'published') return null;
  // … busca o snapshot da maior versão …
}
```

A rota pública é deliberadamente trivial — toda a inteligência está no builder:

```typescript
// apps/api/src/routes/screens.ts  (real, na íntegra)
export async function publicScreenRoutes(app: FastifyInstance) {
  app.get('/screens/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const config = await getPublishedScreenConfig(slug);
    if (!config) return reply.status(404).send({ error: 'Screen not found or not published' });
    return config;
  });
}
```

**Modelo de dados** (do `SPEC.md`): `screens` (metadados) → `sections` (draft editável: type, sort_order, enabled, props JSON) → `screen_versions` (snapshot imutável que o app consome). Esse padrão **draft → publish → snapshot versionado** é o que permite rollback de layout e previews seguros.

### 3.5 Peças 4 e 5 — Registry + Renderer (o lado cliente)

Este é o conceito mais importante para portar SDUI para qualquer tecnologia mobile. O cliente mantém um **registry**: um mapa de `type` (string) → componente.

```typescript
// apps/web/src/sdui/registry.ts  (real)
export const registry: Record<SectionType, ComponentType<any>> = {
  hero_banner:    HeroBanner,
  album_carousel: AlbumCarousel,
  playlist_grid:  PlaylistGrid,
  promo_card:     PromoCard,
  text_block:     TextBlock,
};
```

O **renderer** percorre as seções e, para cada uma, busca o componente no registry — caindo para o fallback se o `type` for desconhecido (princípio fail-safe):

```tsx
// apps/web/src/sdui/SectionRenderer.tsx  (real)
export function SectionRenderer({ section }: { section: SectionConfig }) {
  const Component = registry[section.type as keyof typeof registry];
  if (!Component) return <UnknownFallback type={section.type} sectionId={section.id} />;
  return <Component {...section.props} />;
}

// apps/web/src/sdui/ScreenRenderer.tsx  (real)
export function ScreenRenderer({ config }: { config: ScreenConfig }) {
  const style = themeStyle(config.theme);                       // tema → CSS variables
  const visibleSections = config.sections.filter((s) => s.enabled);   // respeita enabled
  return (
    <div style={style} className="space-y-8 text-[var(--color-text)]">
      {visibleSections.map((s) => <SectionRenderer key={s.id} section={s} />)}
    </div>
  );
}
```

O fallback **nunca deixa a tela quebrar** — ele loga e mostra um aviso contido:

```tsx
// apps/web/src/sdui/components/UnknownFallback.tsx  (real)
export function UnknownFallback({ type, sectionId }: { type: string; sectionId: string }) {
  console.warn(`Unknown SDUI section type: ${type} (id: ${sectionId})`);
  return <section className="…">Componente desconhecido: {type}</section>;
}
```

> **Por que o fallback é crucial em mobile:** se você adicionar um novo `type` no servidor mas um usuário ainda estiver numa versão antiga do app (que não tem aquele componente no registry), o fallback impede crash. Esse é o mecanismo de **compatibilidade retroativa** do SDUI — equivalente ao que você fará com `UnknownView`/`EmptyView` no nativo.

### 3.6 Theming dinâmico

O tema também vem do servidor. O projeto define *presets* (`spotify`, `netflix`, `disney`) em `libs/shared/src/themes.ts` e converte o tema resolvido em CSS variables no cliente:

```typescript
// libs/shared/src/themes.ts  (trecho)
export const THEME_PRESETS = {
  spotify: { primaryColor: '#1DB954', backgroundColor: '#121212', surfaceColor: '#181818', … },
  netflix: { primaryColor: '#E50914', backgroundColor: '#141414', … },
  disney:  { primaryColor: '#0063E5', backgroundColor: '#040714', … },
};
export function themeToCssVariables(theme) {
  return { '--color-primary': theme.primaryColor, '--color-background': theme.backgroundColor, … };
}
```

Em mobile nativo o equivalente é gerar um **design token set** a partir do JSON e aplicar via tema do framework (ver §4).

### 3.7 Fluxo completo (do dashboard ao app)

```
Operador no Dashboard                API (Fastify)                  App (cliente SDUI)
─────────────────────                ─────────────                  ──────────────────
1. cria/edita seções    ──POST/PATCH──►  grava em `sections` (draft)
2. vê preview ao vivo   ──GET preview──►  buildDraftPreview() ──────►  ScreenRenderer (mesmo do app!)
3. clica "Publicar"     ──POST publish─►  publishScreen():
                                          • valida Zod
                                          • version++              
                                          • grava snapshot imutável
                                                  │
   ┌──────────────────────────────────────────────┘
   ▼
4. App abre / faz pull   ──GET /screens/home──►  getPublishedScreenConfig()
                                          ◄── ScreenConfig JSON ──
5. App valida o JSON (defesa em profundidade), aplica tema, renderiza seções enabled
```

---

## 4. SDUI em cada tecnologia mobile

A ideia é **sempre a mesma** (contrato → registry → renderer → fallback). Muda a linguagem do registry e como você desenha cada componente. Abaixo, o "como funciona" e o "como implementar" em cada stack.

### 4.0 O esqueleto universal

Em qualquer tecnologia, você vai escrever quatro coisas:

1. **Modelos do contrato** — tipos que espelham o `ScreenConfig`/`SectionConfig`.
2. **Decodificação segura** — parse do JSON que não explode com `type` desconhecido.
3. **Registry** — mapa `type → builder/factory/component`.
4. **Renderer** — itera seções, aplica `enabled`, chama o registry, usa fallback.

### 4.1 React Native

**Como funciona:** Idêntico ao web do projeto — RN é React. Você troca `<div>` por `<View>`, CSS por `StyleSheet`/`flex`. O registry é um objeto `Record<type, Component>`.

```tsx
// registry.native.ts
const registry: Record<string, React.ComponentType<any>> = {
  hero_banner: HeroBanner,
  album_carousel: AlbumCarousel,
  playlist_grid: PlaylistGrid,
};

// ScreenRenderer.native.tsx
export function ScreenRenderer({ config }: { config: ScreenConfig }) {
  return (
    <ScrollView style={{ backgroundColor: config.theme?.backgroundColor }}>
      {config.sections.filter(s => s.enabled).map((s) => {
        const C = registry[s.type];
        return C ? <C key={s.id} {...s.props} /> : <UnknownFallback key={s.id} type={s.type} />;
      })}
    </ScrollView>
  );
}
```

**Como implementar:**
- Reaproveite **literalmente** os schemas Zod de `libs/shared` (RN roda Zod sem problema) → validação igual ao backend.
- Use `react-query`/TanStack Query para cachear o `ScreenConfig` (igual ao projeto web), com `staleTime` e persistência offline (`@tanstack/query-async-storage-persister`).
- **Plus mobile:** RN permite combinar SDUI com **OTA de verdade** (Expo Updates / CodePush) — você pode entregar *componentes novos* via OTA e *layout novo* via SDUI. Isso é o melhor dos dois mundos.
- Para ações/navegação dirigidas por servidor, padronize um campo `action` nas props (ex.: `{ "type": "navigate", "screen": "album", "params": {…} }`) e um *action handler* central — nunca `eval`.

### 4.2 Flutter

**Como funciona:** O registry é um `Map<String, Widget Function(Map<String,dynamic> props)>`. Cada entrada é uma *factory* que recebe as props e devolve um `Widget`.

```dart
typedef SectionBuilder = Widget Function(Map<String, dynamic> props);

final Map<String, SectionBuilder> registry = {
  'hero_banner':    (p) => HeroBanner.fromProps(p),
  'album_carousel': (p) => AlbumCarousel.fromProps(p),
  'playlist_grid':  (p) => PlaylistGrid.fromProps(p),
};

class ScreenRenderer extends StatelessWidget {
  final ScreenConfig config;
  const ScreenRenderer(this.config, {super.key});

  @override
  Widget build(BuildContext context) {
    final sections = config.sections.where((s) => s.enabled);
    return ListView(
      children: [
        for (final s in sections)
          (registry[s.type] ?? (_) => UnknownFallback(type: s.type))(s.props),
      ],
    );
  }
}
```

**Como implementar:**
- Use `freezed` + `json_serializable` para gerar os modelos do contrato com segurança de tipo, ou `sealed class` (Dart 3) para a união discriminada por `type`.
- Para JSON desconhecido, faça o parse com um *fallback type* (não use `fromJson` que lança exceção em campo faltando — capture e devolva `UnknownSection`).
- Ecossistema: existem libs prontas (ex.: pacotes de "server-driven UI"/"json to widget" como `json_dynamic_widget`, `mirai`, `stac`) que já trazem registry + parser. Avalie antes de construir do zero — mas entenda os limites (segurança, componentes customizados).
- **Theming:** mapeie o JSON de tema para um `ThemeData`/`ColorScheme` do Material.

### 4.3 Android nativo (Jetpack Compose)

**Como funciona:** Decodifique o JSON com `kotlinx.serialization` usando uma **`sealed class`** (o equivalente exato da união discriminada do Zod). O registry vira um `when` sobre o tipo selado, ou um `Map<String, @Composable (Props) -> Unit>`.

```kotlin
// Contrato — união discriminada por "type"
@Serializable
sealed class Section {
    abstract val id: String
    abstract val enabled: Boolean

    @Serializable @SerialName("hero_banner")
    data class HeroBanner(override val id: String, override val enabled: Boolean,
                          val props: HeroProps) : Section()

    @Serializable @SerialName("album_carousel")
    data class AlbumCarousel(override val id: String, override val enabled: Boolean,
                             val props: CarouselProps) : Section()
}

// Renderer — registry via when, com fallback no else
@Composable
fun ScreenRenderer(config: ScreenConfig) {
    LazyColumn {
        items(config.sections.filter { it.enabled }, key = { it.id }) { section ->
            when (section) {
                is Section.HeroBanner    -> HeroBannerView(section.props)
                is Section.AlbumCarousel -> AlbumCarouselView(section.props)
                else                     -> UnknownFallback(section)   // fail-safe
            }
        }
    }
}
```

**Como implementar:**
- Configure o `Json { ignoreUnknownKeys = true; isLenient = true }` e um `JsonClassDiscriminator("type")` ou `SerializersModule` com `polymorphic` + um *default* para tipos desconhecidos (essencial para compatibilidade retroativa).
- O Airbnb popularizou esse padrão (sistema "Ghost Platform"/SDUI). A chave nativa é: **componentes pré-compilados no app + servidor escolhe e configura**.
- **Limite:** você não pode introduzir um *componente visual totalmente novo* sem release do app — apenas reconfigurar/recombinar os existentes. Para componentes novos sem release, você precisa de OTA (limitado no Android nativo — ver §6/§9) ou de uma camada interpretada.

### 4.4 iOS nativo (SwiftUI)

**Como funciona:** Use `Codable` com um `enum` que decodifica pelo campo `type`. O `@ViewBuilder` faz o papel do renderer.

```swift
enum Section: Decodable, Identifiable {
    case heroBanner(id: String, props: HeroProps)
    case albumCarousel(id: String, props: CarouselProps)
    case unknown(id: String, type: String)          // fail-safe

    var id: String { … }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let type = try c.decode(String.self, forKey: .type)
        switch type {
        case "hero_banner":    self = .heroBanner(id: …, props: try c.decode(HeroProps.self, forKey: .props))
        case "album_carousel": self = .albumCarousel(id: …, props: try c.decode(CarouselProps.self, forKey: .props))
        default:               self = .unknown(id: …, type: type)     // nunca lança
        }
    }
}

struct ScreenRenderer: View {
    let config: ScreenConfig
    var body: some View {
        ScrollView {
            ForEach(config.sections.filter { $0.enabled }) { section in
                switch section {
                case .heroBanner(_, let p):    HeroBannerView(props: p)
                case .albumCarousel(_, let p): AlbumCarouselView(props: p)
                case .unknown(_, let t):       UnknownFallback(type: t)
                }
            }
        }
    }
}
```

**Como implementar:**
- O ponto crítico no iOS é **nunca lançar exceção** no decode de um `type` desconhecido — caia para `.unknown`. Decode de props deve ser tolerante a campos novos.
- Mesma limitação do Android: SwiftUI nativo só recombina componentes já compilados. Apple **proíbe baixar e executar código nativo** (ver §9); SDUI é seguro porque entrega *dados*, não código.

### 4.5 Ionic / Capacitor (o caso da família OTA-DRIVE)

**Como funciona:** É o caminho mais direto, porque a UI já é web (Angular/React/Vue numa WebView). O renderer SDUI do `server-driven-ui` (React) roda *quase sem mudança* dentro de um app Capacitor. E o grande diferencial: **Capacitor permite OTA real do bundle web** (é o que o `app-OTA` faz), então SDUI + OTA convivem naturalmente.

**Como implementar:**
- A camada de UI (`www/`) é exatamente o que o `app-OTA` baixa e troca via OTA. Você pode:
  1. embarcar o renderer SDUI no bundle web, e
  2. usar OTA para atualizar *o próprio renderer* (adicionar novos `type`/componentes) sem passar pela loja.
- Para acesso nativo (câmera, arquivos, rede), use os plugins Capacitor — exatamente como o `app-OTA` usa `@capacitor/filesystem`, `@capacitor/preferences`, `@capacitor/network`.
- Trade-off: WebView tem performance inferior ao nativo puro em listas pesadas/animações; para a maioria dos apps de conteúdo é aceitável.

### 4.6 Kotlin Multiplatform / Compose Multiplatform

**Como funciona:** Você escreve o **contrato + parser + registry uma vez** em Kotlin (`commonMain`) com `kotlinx.serialization`, e os renderers em Compose Multiplatform compartilhados entre Android e iOS. É o melhor custo-benefício quando o alvo é nativo nas duas plataformas com um só código de SDUI.

**Como implementar:** mesma `sealed class` da §4.3, em `commonMain`; renderers `@Composable` compartilhados; pontos específicos de plataforma via `expect/actual`.

### 4.7 Resumo: o registry em cada linguagem

| Tecnologia | Estrutura do contrato | Registry | Fallback |
|---|---|---|---|
| React Native | TS types + Zod | `Record<string, Component>` | `<UnknownFallback/>` |
| Flutter | `sealed class` / `freezed` | `Map<String, WidgetBuilder>` | `UnknownFallback` widget |
| Android (Compose) | `sealed class` + kotlinx.serialization | `when` / `Map<String,@Composable>` | branch `else` |
| iOS (SwiftUI) | `enum: Decodable` | `switch` em `@ViewBuilder` | case `.unknown` |
| Ionic/Capacitor | TS types + Zod (web) | objeto `Record` | componente web |
| KMP/Compose MP | `sealed class` (commonMain) | `when` compartilhado | branch `else` |

**Regra de ouro do SDUI mobile:** *o decodificador nunca pode lançar exceção por causa de um `type` ou campo desconhecido.* É isso que garante que servidor e app evoluam em ritmos diferentes sem quebrar usuários em versões antigas.

---

## 5. Micro Front-ends para Mobile

### 5.1 O conceito (origem na web)

Micro Front-end (MFE) é levar a ideia de microsserviços para o front: **dividir a aplicação em pedaços independentes**, cada um pertencente a um time, desenvolvido, versionado e (idealmente) implantado de forma autônoma, e compostos em runtime num "host"/"shell".

Na web isso é resolvido com **Module Federation** (Webpack 5 / Rspack / Vite), onde o host carrega *remotes* em runtime.

### 5.2 Por que MFE é difícil em mobile (e como contornar)

O modelo da web (carregar JS remoto em runtime) **bate de frente com a regra fundamental das lojas**: você não pode baixar e executar *código nativo* arbitrário (ver §9). Por isso, MFE em mobile assume formas diferentes conforme a tecnologia:

```
                       ┌────────────────────────────────────────────┐
                       │  SHELL / SUPER-APP (host)                  │
                       │  navegação, auth, sessão, design system    │
                       └───────────────┬────────────────────────────┘
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
   ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
   │ Mini-app A      │       │ Mini-app B      │       │ Mini-app C      │
   │ (time Pagamentos)│      │ (time Catálogo) │       │ (time Perfil)   │
   │ bundle próprio   │      │ bundle próprio  │       │ bundle próprio  │
   └─────────────────┘       └─────────────────┘       └─────────────────┘
```

### 5.3 Estratégias por tecnologia

**A) React Native — Re.Pack + Module Federation**
- **Como funciona:** [Re.Pack](https://re-pack.dev/) (bundler baseado em Webpack/Rspack para RN) traz **Module Federation v2** para mobile. O host carrega *remotes* (cada um um bundle JS) em runtime, hospedados no seu servidor/CDN.
- **Como implementar:** defina containers `host` e `remote`; o host declara os remotes; cada time publica seu bundle. Combine com OTA (Repack + Expo Updates) para atualizar remotes sem release. **Atenção:** dependências compartilhadas (React, RN) precisam de versões alinhadas (`shared` singletons).

**B) Modelo Super-App / Mini-Apps (WeChat, Mercado Livre, iFood, bancos)**
- **Como funciona:** o app nativo é um **container** que hospeda mini-apps. Cada mini-app é um bundle (web numa WebView, ou JS/RN, ou um runtime tipo mini-program). O shell oferece um **SDK/bridge** (auth, pagamento, navegação, APIs nativas).
- **Como implementar:** padronize um *manifest* por mini-app (id, versão, entrypoint, permissões), um *bridge* JS↔nativo bem definido, e um pipeline de publicação/versionamento. Frameworks de referência open source: super-app engines baseados em web (ex.: mini-program runtimes). Esse é o ponto onde **MFE se encontra com OTA**: cada mini-app é entregue/atualizado como um bundle.

**C) Flutter — add-to-app / modularização**
- **Como funciona:** Flutter não tem "Module Federation". MFE em Flutter é majoritariamente **modularização em tempo de build** (pacotes/`melos` monorepo, cada feature um package), com fronteiras de time bem definidas. Para múltiplos times em apps grandes, usa-se **add-to-app** (Flutter embarcado em host nativo) ou *flavors*/feature packages.
- **Como implementar:** monorepo com `melos`, um package por domínio, navegação por rotas declaradas, injeção de dependências (get_it/riverpod). Entrega dinâmica de *código Dart* só via Shorebird (ver §6) — não há federation runtime oficial.

**D) Nativo (Android/iOS) — feature modules**
- **Android:** [Play Feature Delivery / Dynamic Feature Modules](https://developer.android.com/guide/playcore/feature-delivery) permite módulos baixados **sob demanda pela Play Store** (não do seu servidor). É MFE no sentido de modularização + entrega condicional, mas a entrega é controlada pelo Google Play.
- **iOS:** não há entrega dinâmica de código; modularização é via Swift Packages/frameworks em build. App Clips cobrem o caso de "pedaço pequeno sob demanda", mas não é MFE de times.
- **Conclusão nativa:** MFE nativo ≈ **modularização forte por times + monorepo + contratos de interface**, não carregamento remoto de código.

**E) Híbrido / Capacitor — cada micro-app é um bundle web**
- **Como funciona:** como a UI é web, cada micro front-end é literalmente um bundle web independente. O shell Capacitor pode rotear entre eles e atualizá-los via OTA (o mecanismo do `app-OTA`). É a forma mais próxima do MFE web "de verdade" em mobile.

### 5.4 Tabela: MFE por tecnologia

| Tecnologia | Mecanismo de MFE | Entrega dinâmica de código? | Maturidade |
|---|---|---|---|
| React Native | Re.Pack + Module Federation v2 | Sim (bundles JS) | Crescendo, viável em produção |
| Híbrido (Capacitor/Ionic) | Bundles web independentes + WebView | Sim (OTA do bundle) | Alta (é web) |
| Super-App / Mini-apps | Container + bridge + manifest | Sim (mini-app = bundle) | Alta (padrão de mercado) |
| Flutter | Modularização (melos) + add-to-app | Não nativamente (só Shorebird p/ código) | Build-time |
| Android nativo | Dynamic Feature Modules (via Play) | Sim, mas via Google Play | Alta (oficial) |
| iOS nativo | Swift Packages/frameworks (build) | Não | Build-time |

### 5.5 SDUI vs MFE — escolhendo (ou combinando)

- Use **SDUI** quando o que muda é *configuração/conteúdo/layout* com um conjunto fixo de componentes. Mais simples, mais seguro nas lojas, governado por PM.
- Use **MFE** quando o que muda é *funcionalidade inteira por time* e você precisa de autonomia de deploy entre squads.
- **Combine:** um mini-app (MFE) que internamente usa SDUI para suas telas de conteúdo, entregue via OTA. É o padrão de super-apps maduros.

---

## 6. Atualizações OTA (Over-The-Air)

> Esta seção é fundamentada nos projetos `app-OTA` (cliente Ionic/Capacitor) e `server-OTA` (servidor Next.js/Vercel). É o coração da parte "mobile" da família OTA-DRIVE.

### 6.1 O que pode e o que NÃO pode mudar via OTA

Direto do README do `app-OTA` — esta tabela é a regra mental mais importante:

| | APK Build (loja) | Bundle OTA |
|---|---|---|
| O que é | App completo instalado | Só o `www/` (HTML/JS/CSS) compactado |
| Como atualiza | Usuário reinstala | App baixa em background |
| Pode mudar telas/temas | Sim | **Sim** |
| Pode mudar lógica (camada web/Angular) | Sim | **Sim** |
| Pode adicionar **plugin nativo** | Sim | **Não** |
| Pode mudar **permissões Android** | Sim | **Não** |
| Gerado por | `build-apk.yml` | `deploy-ota.yml` |

> **Regra prática (do projeto):** mudou só código da camada web/Angular? OTA resolve. Mudou plugin nativo ou permissão? Precisa de novo APK.

### 6.2 Arquitetura do sistema OTA do projeto

```
Desenvolvedor                 GitHub Actions              server-OTA (Vercel)        app-OTA (celular)
─────────────                 ──────────────              ──────────────────         ─────────────────
push p/ app-OTA  ──►  deploy-ota.yml:
                      • ng build --prod
                      • zip www/ → bundle-x.y.z.zip
                      • sha256 do zip
                      • atualiza manifest.json
                      • git push ──► server-OTA  ──► Vercel deploy automático
                                                          │
                                                          ▼
                                              GET /api/version  ◄────────  app abre
                                              { version, sha256, hmac, … } ──►
                                                                            valida HMAC
                                              GET /api/bundle/x.y.z ◄──────  baixa zip
                                                                            verifica sha256
                                                                            extrai + "stage"
                                                                            aplica no próximo launch
                                              POST /api/report  ◄────────  telemetria (success/rollback)
```

### 6.3 O fluxo do cliente (passo a passo, com o código real)

O `OtaManagerService` (Angular) implementa um ciclo robusto. As etapas:

**1. Checagem de versão** (com rate limit e header da versão atual):
```typescript
// app-OTA/src/app/services/ota-manager.service.ts (trecho)
const response = await fetch(`${environment.otaServerUrl}/api/version`, {
  headers: { 'X-Current-Version': this.state.currentVersion },
});
const versionData: VersionResponse = await response.json();

// Valida HMAC ANTES de confiar
if (!(await this.verifyHmac(versionData))) {
  console.error('[OTA] HMAC verification failed! Possible MITM attack.');
  return null;
}
// Anti-downgrade: nunca aplicar versão <= atual
if (this.compareVersions(versionData.version, this.state.currentVersion) <= 0) return null;
```

**2. Download + verificação de integridade (SHA-256) com retry exponencial:**
```typescript
const arrayBuffer = await response.arrayBuffer();
const sha256 = await this.calculateSha256(arrayBuffer);
if (sha256 !== versionData.sha256) {
  console.error('[OTA] SHA-256 mismatch!');   // descarta — corrupção ou MITM
  return false;
}
// ... salva o zip no Filesystem (Directory.Data) ...
const delay = Math.pow(2, retries) * 1000;     // backoff exponencial entre tentativas
```

**3. "Stage" (extração antecipada, sem interromper o uso atual):**
```typescript
// Extrai o zip via PLUGIN NATIVO (Capacitor não extrai zip sozinho)
const result = await OtaBundle.extractZip({ zipPath, targetDir });
// Valida que o bundle extraído tem index.html
const validation = await OtaBundle.validateBundle({ path: extractAbsolutePath });
if (!validation.valid) { /* descarta */ }
// Marca como "staged" — será aplicado no PRÓXIMO launch
await Preferences.set({ key: 'ota_staged_version', value: JSON.stringify(staged) });
```

**4. Aplicação no próximo launch (troca o "server base path" da WebView):**
```typescript
// No próximo initialize(): applyStagedBundleIfAvailable()
await WebView.setServerBasePath({ path: staged.path });   // WebView passa a carregar o novo bundle
await WebView.persistServerBasePath();
```

O plugin nativo é declarado no TS e implementado em Java (gerado no CI):
```typescript
// app-OTA/src/app/plugins/ota-bundle.plugin.ts (real)
export interface OtaBundlePlugin {
  extractZip(options: { zipPath: string; targetDir: string }): Promise<ExtractZipResult>;
  resetToDefault(): Promise<void>;
  validateBundle(options: { path: string }): Promise<ValidateBundleResult>;
}
const OtaBundle = registerPlugin<OtaBundlePlugin>('OtaBundle');
```

### 6.4 Segurança: HMAC + SHA-256 + anti-downgrade

O sistema implementa **duas camadas criptográficas** (defesa em profundidade):

1. **Autenticidade (HMAC-SHA256):** o servidor assina `"{version}:{sha256}:{minVersion}:{timestamp}"`. O app verifica a assinatura antes de baixar qualquer coisa — bloqueia respostas adulteradas (MITM).
   ```typescript
   // server-OTA/app/api/version/route.ts (real)
   const hmacPayload = `${latest.version}:${latest.sha256}:${manifest.minVersion}:${timestamp}`;
   const hmac = generateHmac(hmacPayload);   // crypto.createHmac('sha256', HMAC_SECRET)
   ```
2. **Integridade (SHA-256):** o `.zip` tem um hash; o app recalcula após o download e compara antes de extrair. Hash diferente → descarta.

> ⚠️ **Ponto de atenção real no código:** o `verifyHmac` do cliente faz *skip* da verificação se nenhuma chave HMAC estiver provisionada no device (`if (!hmacKey) return true`). O próprio comentário do código observa que, em produção, **a chave deve ser provisionada via Keychain (iOS)/Keystore (Android)**, não em `Preferences`. Em produção, NÃO deixe o skip ativo — provisionar a chave é obrigatório para a camada de autenticidade ter valor.

### 6.5 Health check e rollback automático

A peça que torna OTA *seguro* em produção é o **rollback automático**. O `app-OTA` faz:

- Ao aplicar um bundle novo (≠ baseline), dispara um **timer de health check** (`bundleHealthCheckTimeoutMs`, ~15s).
- O app, ao carregar com sucesso, chama `confirmHealthy()` que cancela o timer.
- Se o app **não confirmar saúde a tempo** (ex.: bundle quebrado, tela branca), o timer dispara `rollback()`.
- O rollback volta para a versão anterior (mantém histórico em `previousVersions`); após **3 rollbacks consecutivos** ou sem histórico, faz `resetToBaseline()` — volta para o `www/` embutido no APK.

```typescript
// startHealthCheck(): se não confirmar saúde, faz rollback automático
this.healthCheckTimer = setTimeout(async () => {
  console.error('[OTA] Health check timeout! App did not confirm healthy within 15s.');
  await this.rollback();
}, environment.bundleHealthCheckTimeoutMs);
```

Esse padrão **stage → apply → health check → rollback** é o que diferencia um OTA caseiro de um OTA de produção. É o mesmo princípio do CodePush/Expo Updates.

### 6.6 CI/CD (GitHub Actions)

O projeto separa dois pipelines:
- **`deploy-ota.yml`** (todo push em `main`): build Angular → zip `www/` → sha256 → atualiza `manifest.json` → push para `server-OTA` → Vercel publica. Resultado: usuários recebem a atualização **sem reinstalar**.
- **`build-apk.yml`**: gera o APK completo (Java 21 + Android SDK, `cap add android`, cria o `OtaBundlePlugin.java`, permissões, `cap sync`, `gradle assembleDebug`). Necessário só quando muda algo nativo.

### 6.7 OTA em cada tecnologia mobile

| Tecnologia | Solução OTA | Como funciona | Observações |
|---|---|---|---|
| **Capacitor/Ionic** | **Appflow Live Updates** (Ionic, pago), **[Capgo](https://capgo.app/) `@capacitor/updater`** (open source), ou **custom** (como o `app-OTA`) | Troca o conteúdo da WebView (`setServerBasePath`) por um bundle web baixado | É o caso do projeto. Mais flexível porque a UI é web |
| **React Native** | **Expo Updates / EAS Update** (recomendado hoje), **CodePush** | Substitui o *JS bundle* em runtime; o app reinicia carregando o novo | Microsoft App Center foi **descontinuado (mar/2025)**; o CodePush hoje é OSS/standalone. EAS Update é o caminho mainstream |
| **Flutter** | **[Shorebird](https://shorebird.dev/) (code push)** | Distribui *patches* do código Dart compilado (AOT) sem nova submissão | Solução dedicada; respeita políticas das lojas |
| **Android nativo** | Dynamic Feature Modules (via Play); **não** OTA de código arbitrário do seu servidor | Módulos baixados pela Play Store | Carregar DEX do seu servidor para alterar comportamento viola políticas |
| **iOS nativo** | **Não permitido** para código nativo | — | Apple só permite *interpreted code* via JavaScriptCore/WebKit (ver §9) |

**Por que Capacitor e RN têm OTA "fácil" e nativo não:** porque a camada de apresentação deles é **interpretada** (JS/WebView). As lojas permitem atualizar *código interpretado* baixado, desde que não mude o propósito do app. Código *nativo* baixado é proibido. Shorebird é a exceção engenhosa para Flutter (faz patch do runtime de forma compatível com as regras).

---

## 7. Combinando as três arquiteturas

As três não competem — **se empilham**. Uma arquitetura de referência madura para mobile:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  APP NATIVO / HÍBRIDO (shell)                                             │
│  • navegação, auth, sessão, plugins nativos                              │
│                                                                          │
│  ┌────────────────────────── MICRO FRONT-ENDS ────────────────────────┐  │
│  │  mini-app Home    mini-app Catálogo    mini-app Perfil             │  │
│  │  ────────────     ───────────────      ──────────────             │  │
│  │  cada um:                                                          │  │
│  │   • entregue/atualizado via OTA (bundle)  ◄── camada OTA           │  │
│  │   • telas montadas via SDUI (JSON)        ◄── camada SDUI          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
        │                         │                          │
        ▼                         ▼                          ▼
  Servidor SDUI            Servidor OTA              Backend de domínio
  (ScreenConfig JSON)      (bundles + manifest       (dados de negócio)
                            + HMAC, como server-OTA)
```

Decisão de qual camada usar para cada mudança:

| Tipo de mudança | Camada certa | Precisa de release na loja? |
|---|---|---|
| Trocar texto/imagem/ordem de uma seção | **SDUI** | Não |
| Ligar/desligar uma seção | **SDUI** (`enabled`) | Não |
| Trocar tema/cores | **SDUI** (theme) | Não |
| Corrigir bug de lógica na camada web/JS | **OTA** | Não |
| Adicionar um *novo tipo de componente* | OTA (se interpretado) **+** registrar no app | Não (RN/Capacitor) / Sim (nativo puro) |
| Adicionar feature inteira por outro time | **MFE** (novo mini-app) | Depende da entrega |
| Adicionar plugin nativo / permissão | **Novo build** | **Sim** |

---

## 8. Guia de implementação passo a passo

### 8.1 SDUI mínimo viável (qualquer stack)

1. **Defina o contrato primeiro** (schema-first). Comece com 3–5 tipos de seção. Use uma união discriminada por `type` (Zod / sealed class / enum Codable).
2. **Backend:** endpoint `GET /screens/:slug` que devolve o `ScreenConfig` da **versão publicada**. Separe draft de published com snapshot imutável e versão incremental (padrão do `screen-builder.ts`).
3. **Cliente:**
   - decodificação tolerante (nunca lança em `type`/campo desconhecido);
   - registry `type → componente`;
   - renderer que filtra `enabled`, itera, chama o registry, usa fallback;
   - cache do JSON (TanStack Query / equivalente) com persistência offline.
4. **Theming:** aplique o tema do JSON via tokens/CSS variables/`ThemeData`.
5. **Governança:** dashboard com preview ao vivo usando *o mesmo renderer* do app (como o projeto faz com `buildDraftPreview`).

### 8.2 OTA mínimo viável (foco Capacitor/RN)

1. **Servidor de bundles** com: `GET /version` (assinado por HMAC), `GET /bundle/:version` (zip imutável, cache 1 ano), `POST /report` (telemetria), e um `manifest.json` (`currentVersion`, `minVersion`, lista de versões com `sha256` e `size`). Espelhe o `server-OTA`.
2. **Cliente** com o ciclo: `check (HMAC) → download (SHA-256 + retry) → stage (extrai + valida index.html) → apply no próximo launch → health check → rollback`. Espelhe o `OtaManagerService`.
3. **Segurança não-negociável:** verificação HMAC obrigatória (chave no Keychain/Keystore, **não** em Preferences), verificação SHA-256, anti-downgrade, `minVersion` para forçar update via loja quando necessário.
4. **CI/CD:** pipeline separado para "bundle OTA" (deploy rápido) e "build nativo" (quando muda nativo).
5. **Conformidade com as lojas:** ver §9 antes de produção.

### 8.3 Checklist de produção

- [ ] Decodificador SDUI nunca lança por `type`/campo desconhecido (fallback testado).
- [ ] Contrato versionado; mudanças retrocompatíveis (campos novos opcionais).
- [ ] Cache + estados de loading/erro/offline no cliente SDUI.
- [ ] OTA: HMAC com chave em armazenamento seguro nativo (sem skip em prod).
- [ ] OTA: SHA-256 verificado antes de extrair.
- [ ] OTA: health check + rollback automático + reset para baseline.
- [ ] OTA: `minVersion`/`forceUpdate` para quebras incompatíveis com o nativo.
- [ ] Telemetria de adoção e rollbacks (taxa de falha por versão).
- [ ] Conformidade documentada com Apple Guideline 3.3.2/2.5.2 e políticas do Google Play.

---

## 9. Políticas das App Stores

Esta é a seção que separa um protótipo de um produto que **não toma rejeição/ban**. Resumo conservador (sempre confirme a versão vigente das diretrizes):

**Apple (App Store Review Guidelines)**
- **2.5.2** — Apps devem ser self-contained; **não podem baixar nem executar código** que altere recursos/funcionalidades além do propósito anunciado.
- **3.3.2 / exceção de código interpretado** — é permitido baixar e executar **código interpretado** (ex.: JavaScript) *desde que* (a) não mude o propósito primário do app, (b) seja executado pela WebKit/JavaScriptCore da Apple, e (c) não crie uma loja de apps paralela.
- **Tradução prática:** OTA de *bundle web/JS* (Capacitor, RN, Expo) é aceitável dentro desses limites. OTA de *código nativo* arbitrário é proibido. SDUI (entrega de **dados**, não código) é o mais seguro de todos.

**Google Play**
- Proíbe atualizações que **driblem o mecanismo de update do Google Play** para alterar o comportamento do app de forma que viole políticas (ex.: carregar DEX/código executável do seu servidor para mudar funcionalidade).
- Entrega modular legítima é via **Play Feature Delivery / App Bundles**.
- OTA de camada web (WebView/Capacitor) e de JS bundle (RN) é amplamente usado e aceito, observadas as políticas de conteúdo e segurança.

**Regras de ouro para não tomar rejeição:**
1. OTA só na **camada de apresentação interpretada** (web/JS/Dart-via-Shorebird), nunca código nativo do seu servidor.
2. OTA **não pode mudar o propósito** do app nem introduzir funcionalidade proibida pós-revisão.
3. Mudanças nativas (plugins, permissões) **sempre** via release na loja — exatamente a regra que o `app-OTA` documenta.
4. SDUI é o caminho mais seguro porque entrega **configuração/dados**, indistinguível de "conteúdo".

---

## 10. Boas práticas, armadilhas e segurança

**Contrato e compatibilidade**
- Trate o contrato SDUI como **API pública versionada**. Campos novos sempre opcionais; nunca remova/renomeie sem migração.
- O app antigo precisa renderizar (ou ignorar via fallback) `type`s que ainda não conhece. Teste isso de propósito.

**Performance e UX**
- Cacheie o `ScreenConfig` e renderize o cache instantaneamente; revalide em background (stale-while-revalidate). O projeto usa TanStack Query para isso.
- Em listas longas, use virtualização nativa (`FlatList`/`LazyColumn`/`ListView.builder`).
- Pré-busque imagens citadas no JSON.

**Offline**
- Persista o último `ScreenConfig` válido. Sem rede → renderize o último bom.
- OTA: nunca aplique um bundle não verificado; mantenha sempre o baseline embutido como rede de segurança (como o `resetToBaseline`).

**Segurança (do que vimos no código)**
- HMAC para autenticidade da resposta de versão; SHA-256 para integridade do bundle; **chave HMAC no Keystore/Keychain**.
- Anti-downgrade (`compareVersions <= 0` ⇒ ignora) evita forçar versões antigas vulneráveis.
- HTTPS obrigatório; valide certificados; considere *certificate pinning* para o endpoint de versão.
- Nunca use `eval`/execução de strings vindas do servidor em SDUI — ações devem ser **declarativas** (um `action handler` com casos fixos).

**Armadilhas comuns**
- Decodificador que lança exceção em campo desconhecido → crash em massa quando o servidor evolui. (Resolva com fallback.)
- OTA sem health check/rollback → um bundle ruim derruba toda a base. (O `app-OTA` resolve com timer + rollback + baseline.)
- Misturar responsabilidades: tentar fazer SDUI "executar lógica" — isso é trabalho de OTA/MFE, não de SDUI.
- Esquecer o limite das lojas e tentar OTA de código nativo → rejeição/ban.

**Observabilidade**
- Telemetria de OTA (`POST /report` com `success`/`rollback`/`error` por versão e plataforma) — o `server-OTA` já expõe isso e um dashboard de adoção.
- Para SDUI, logue `type`s desconhecidos recebidos em produção (o `UnknownFallback` já dá o gancho) para saber quando um servidor está à frente dos apps.

---

## 11. Matriz de decisão: quando usar o quê

| Sua necessidade | Solução recomendada | Tecnologia mais indicada |
|---|---|---|
| Mudar conteúdo/layout/tema sem release, com conjunto fixo de componentes | **SDUI** | Qualquer (RN, Flutter, nativo, Capacitor) |
| Corrigir bug de UI/lógica em horas, sem release | **OTA** | Capacitor (`@capgo`/Appflow/custom), RN (Expo Updates), Flutter (Shorebird) |
| Vários times entregando domínios independentes | **MFE** | RN (Re.Pack/Module Federation) ou Super-app/mini-apps |
| App de conteúdo que muda muito + time pequeno | **SDUI + OTA** | **Capacitor/Ionic** (exatamente a família OTA-DRIVE) |
| Máxima performance nativa + alguma dinâmica | **SDUI** (nativo) + Remote Config | Compose/SwiftUI ou KMP |
| Super-app com ecossistema de parceiros | **MFE (mini-apps) + SDUI + OTA** | Container nativo + bundles web/JS |

**Por que a stack da família OTA-DRIVE (Capacitor + SDUI + OTA) é uma escolha pragmática:** UI é web (reaproveita o renderer SDUI do `server-driven-ui` quase sem mudança), OTA é viável e bem suportado, time pequeno consegue manter, e está dentro das regras das lojas. O trade-off é performance de WebView vs. nativo puro — aceitável para apps de conteúdo.

---

## 12. Glossário e referências

### Glossário

- **SDUI (Server-Driven UI):** servidor envia a *descrição* da tela (JSON); o app tem componentes pré-compilados e só os monta conforme o contrato.
- **Registry:** mapa `type → componente` no cliente; o ponto de extensão do SDUI.
- **Renderer:** itera o contrato e desenha cada seção via registry, com fallback.
- **Fallback / fail-safe:** comportamento para `type`/campo desconhecido que não quebra a tela.
- **OTA (Over-The-Air):** entrega da camada de apresentação (bundle web/JS/patch) sem passar pela loja.
- **Bundle / baseline:** pacote da UI (`www/`); baseline é o bundle embutido no binário (rede de segurança).
- **Staging:** preparar/extrair o bundle novo sem interromper a sessão atual; aplicar no próximo launch.
- **Health check / rollback:** confirmar que o bundle novo carregou; reverter automaticamente se não.
- **HMAC / SHA-256:** autenticidade da resposta de versão / integridade do bundle.
- **Manifest:** arquivo que lista versões disponíveis (`currentVersion`, `minVersion`, hashes).
- **MFE (Micro Front-end):** dividir o front em módulos/mini-apps independentes, compostos em runtime.
- **Module Federation:** mecanismo (web/RN via Re.Pack) de carregar *remotes* em runtime.
- **Super-app / mini-app:** container hospeda mini-apps (cada um um bundle) via SDK/bridge.

### Mapa dos arquivos-chave dos projetos analisados

| Conceito | Arquivo |
|---|---|
| Contrato SDUI (Zod) | `server-driven-ui/libs/shared/src/sdui-schema.ts` |
| Tipos compartilhados | `server-driven-ui/libs/shared/src/types.ts` |
| Presets de tema | `server-driven-ui/libs/shared/src/themes.ts` |
| Builder/publish do JSON | `server-driven-ui/apps/api/src/services/screen-builder.ts` |
| Rota pública SDUI | `server-driven-ui/apps/api/src/routes/screens.ts` |
| Registry (cliente) | `server-driven-ui/apps/web/src/sdui/registry.ts` |
| Renderer | `server-driven-ui/apps/web/src/sdui/{ScreenRenderer,SectionRenderer}.tsx` |
| Fallback | `server-driven-ui/apps/web/src/sdui/components/UnknownFallback.tsx` |
| Gerenciador OTA (cliente) | `app-OTA/src/app/services/ota-manager.service.ts` |
| Plugin nativo (extrair zip) | `app-OTA/src/app/plugins/ota-bundle.plugin.ts` |
| Endpoint de versão + HMAC | `server-OTA/app/api/version/route.ts`, `server-OTA/lib/hmac.ts` |
| Especificação completa SDUI | `server-driven-ui/SPEC.md` |

### Referências externas

- Server-Driven UI — Shopify Engineering: https://shopify.engineering/server-driven-ui-at-shopify
- Server-Driven UI — Airbnb (padrão de "Ghost Platform"/SDUI)
- Module Federation para React Native — Re.Pack: https://re-pack.dev/
- Expo Updates / EAS Update (OTA para RN): https://docs.expo.dev/eas-update/introduction/
- Shorebird (code push para Flutter): https://shorebird.dev/
- Capgo (`@capacitor/updater`, OTA open source para Capacitor): https://capgo.app/
- Play Feature Delivery (Android): https://developer.android.com/guide/playcore/feature-delivery
- Apple App Store Review Guidelines (2.5.2, 3.3.2): https://developer.apple.com/app-store/review/guidelines/
- Zod: https://zod.dev/ · Drizzle ORM: https://orm.drizzle.team/ · Capacitor: https://capacitorjs.com/

---

*Documento gerado a partir da análise dos projetos `server-driven-ui`, `app-OTA`, `server-OTA` e `app-web`. Os trechos de código marcados como "real" foram extraídos diretamente do código-fonte dos projetos; os demais são exemplos ilustrativos por tecnologia.*
