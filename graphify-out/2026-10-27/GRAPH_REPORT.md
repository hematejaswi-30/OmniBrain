# Graph Report - OmniBrain  (2026-10-27)

## Corpus Check
- 32 files · ~50,980 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 175 nodes · 250 edges · 16 communities (11 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2cd6d06b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 🌌 OmniBrain
- package.json
- createServerClient
- compilerOptions
- ConstellationCanvas.tsx
- graph/page.tsx
- dependencies
- ingest-router.ts
- devDependencies
- next
- AGENTS.md
- Header.tsx

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `next` - 15 edges
3. `createServerClient()` - 15 edges
4. `react` - 11 edges
5. `lucide-react` - 9 edges
6. `🌌 OmniBrain` - 9 edges
7. `Header()` - 8 edges
8. `SynthesisDrawer()` - 6 edges
9. `✨ Core Features & Screenshots` - 6 edges
10. `scripts` - 5 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `createServerClient()`  [EXTRACTED]
  src/app/api/clusters/route.ts → src/lib/supabase/server.ts
- `GET()` --calls--> `createServerClient()`  [EXTRACTED]
  src/app/api/graph/route.ts → src/lib/supabase/server.ts
- `GET()` --calls--> `createServerClient()`  [EXTRACTED]
  src/app/api/highlights/route.ts → src/lib/supabase/server.ts
- `POST()` --calls--> `createServerClient()`  [EXTRACTED]
  src/app/api/highlights/route.ts → src/lib/supabase/server.ts
- `DELETE()` --calls--> `createServerClient()`  [EXTRACTED]
  src/app/api/highlights/route.ts → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (16 total, 5 thin omitted)

### Community 0 - "🌌 OmniBrain"
Cohesion: 0.10
Nodes (19): 1. Clone the repository, 1. ⚡ Universal Omni Ingestion Dock, 2. 💬 Conversational Semantic Search ("Ask OmniBrain"), 2. Install dependencies, 3. Configure environment variables (Optional for Demo Mode), 3. 📜 Light Paper Studio Mode, 4. 📑 Multi-Source OmniDoc Synthesis, 4. Run the development server (+11 more)

### Community 1 - "package.json"
Cohesion: 0.11
Nodes (18): name, private, scripts, build, dev, lint, start, version (+10 more)

### Community 2 - "createServerClient"
Cohesion: 0.15
Nodes (16): @google/generative-ai, GET(), SEED_CLUSTERS, GET(), SEED_GRAPH, DELETE(), GET(), POST() (+8 more)

### Community 3 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 4 - "ConstellationCanvas.tsx"
Cohesion: 0.21
Nodes (10): react-force-graph-2d, ConstellationCanvas(), ConstellationCanvasProps, DARK_SOURCE_CONFIG, drawRoundedRect(), ForceGraph2D, GraphLink, GraphNode (+2 more)

### Community 5 - "graph/page.tsx"
Cohesion: 0.21
Nodes (13): lucide-react, react, ConstellationCanvas, GraphPage(), ClusterCardsGridProps, ClusterData, ClusterItem, OmniDocViewer() (+5 more)

### Community 6 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, @google/generative-ai, groq-sdk, lucide-react, next, react, react-dom, react-force-graph-2d (+3 more)

### Community 7 - "ingest-router.ts"
Cohesion: 0.32
Nodes (5): Omnibox(), ingestRouter(), RouteResult, RouteType, SourceType

### Community 8 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, autoprefixer, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript

### Community 10 - "next"
Cohesion: 0.16
Nodes (9): next, DashboardPage(), metadata, ClusterCardsGrid(), OnboardingBanner(), OnboardingBannerProps, DEFAULT_HIGHLIGHTS, Highlight (+1 more)

### Community 13 - "Header.tsx"
Cohesion: 0.23
Nodes (8): @supabase/ssr, Header(), HeaderProps, getSimulatedUser(), setSimulatedUser(), SimulatedUser, UserMode, createClient()

## Knowledge Gaps
- **89 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 103 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `package.json`, `createServerClient`, `ConstellationCanvas.tsx`, `graph/page.tsx`, `Header.tsx`?**
  _High betweenness centrality (0.215) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _89 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `🌌 OmniBrain` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Why does `react` connect `graph/page.tsx` to `package.json`, `ConstellationCanvas.tsx`, `ingest-router.ts`, `next`, `Header.tsx`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._