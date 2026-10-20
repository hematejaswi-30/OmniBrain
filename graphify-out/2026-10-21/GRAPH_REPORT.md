# Graph Report - OmniBrain  (2026-10-16)

## Corpus Check
- 30 files · ~26,426 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 146 nodes · 207 edges · 15 communities (8 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e6b46b09`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- README.md
- package.json
- next
- compilerOptions
- graph/page.tsx
- react
- dependencies
- ingest-router.ts
- devDependencies
- layout.tsx
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `next` - 13 edges
3. `createServerClient()` - 13 edges
4. `react` - 10 edges
5. `lucide-react` - 8 edges
6. `Header()` - 6 edges
7. `SynthesisDrawer()` - 6 edges
8. `scripts` - 5 edges
9. `GraphPage()` - 5 edges
10. `DashboardPage()` - 4 edges

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

## Communities (15 total, 7 thin omitted)

### Community 1 - "package.json"
Cohesion: 0.09
Nodes (19): name, private, scripts, build, dev, lint, start, version (+11 more)

### Community 2 - "next"
Cohesion: 0.16
Nodes (15): @google/generative-ai, next, @supabase/supabase-js, GET(), SEED_CLUSTERS, GET(), SEED_GRAPH, DELETE() (+7 more)

### Community 3 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 4 - "graph/page.tsx"
Cohesion: 0.16
Nodes (13): react-force-graph-2d, ConstellationCanvas, GraphPage(), ConstellationCanvas(), ConstellationCanvasProps, drawRoundedRect(), ForceGraph2D, GraphLink (+5 more)

### Community 5 - "react"
Cohesion: 0.18
Nodes (16): lucide-react, react, DashboardPage(), ClusterCardsGrid(), ClusterCardsGridProps, ClusterData, ClusterItem, OmniDocViewer() (+8 more)

### Community 6 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, @google/generative-ai, groq-sdk, lucide-react, next, react, react-dom, react-force-graph-2d (+3 more)

### Community 7 - "ingest-router.ts"
Cohesion: 0.32
Nodes (5): Omnibox(), ingestRouter(), RouteResult, RouteType, SourceType

### Community 8 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, autoprefixer, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript

## Knowledge Gaps
- **69 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+64 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 84 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `package.json`, `layout.tsx`, `graph/page.tsx`, `react`?**
  _High betweenness centrality (0.244) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _69 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `package.json`, `graph/page.tsx`, `ingest-router.ts`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._