# Graph Report - OmniBrain  (2026-10-21)

## Corpus Check
- 32 files · ~30,486 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 155 nodes · 226 edges · 16 communities (9 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3db2fbc4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- README.md
- package.json
- next
- compilerOptions
- ConstellationCanvas.tsx
- dashboard/page.tsx
- dependencies
- ingest-router.ts
- devDependencies
- layout.tsx
- AGENTS.md
- Header.tsx

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `next` - 14 edges
3. `createServerClient()` - 13 edges
4. `react` - 11 edges
5. `lucide-react` - 9 edges
6. `Header()` - 8 edges
7. `SynthesisDrawer()` - 6 edges
8. `scripts` - 5 edges
9. `DashboardPage()` - 5 edges
10. `GraphPage()` - 4 edges

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

## Communities (16 total, 7 thin omitted)

### Community 1 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, scripts, build, dev, lint, start, version (+11 more)

### Community 2 - "next"
Cohesion: 0.17
Nodes (14): @google/generative-ai, next, GET(), SEED_CLUSTERS, GET(), SEED_GRAPH, DELETE(), GET() (+6 more)

### Community 3 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 4 - "ConstellationCanvas.tsx"
Cohesion: 0.20
Nodes (12): react-force-graph-2d, ConstellationCanvas, GraphPage(), ConstellationCanvas(), ConstellationCanvasProps, DARK_SOURCE_CONFIG, drawRoundedRect(), ForceGraph2D (+4 more)

### Community 5 - "dashboard/page.tsx"
Cohesion: 0.16
Nodes (18): lucide-react, react, DashboardPage(), ClusterCardsGrid(), ClusterCardsGridProps, ClusterData, ClusterItem, OmniDocViewer() (+10 more)

### Community 6 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, @google/generative-ai, groq-sdk, lucide-react, next, react, react-dom, react-force-graph-2d (+3 more)

### Community 7 - "ingest-router.ts"
Cohesion: 0.32
Nodes (5): Omnibox(), ingestRouter(), RouteResult, RouteType, SourceType

### Community 8 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, autoprefixer, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript

### Community 13 - "Header.tsx"
Cohesion: 0.23
Nodes (8): @supabase/ssr, Header(), HeaderProps, getSimulatedUser(), setSimulatedUser(), SimulatedUser, UserMode, createClient()

## Knowledge Gaps
- **73 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+68 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 87 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `package.json`, `ConstellationCanvas.tsx`, `dashboard/page.tsx`, `layout.tsx`, `Header.tsx`?**
  _High betweenness centrality (0.254) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _73 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Why does `react` connect `dashboard/page.tsx` to `package.json`, `ConstellationCanvas.tsx`, `Header.tsx`, `ingest-router.ts`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._