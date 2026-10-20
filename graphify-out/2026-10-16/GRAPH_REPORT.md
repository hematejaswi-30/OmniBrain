# Graph Report - OmniBrain  (2026-10-08)

## Corpus Check
- 29 files · ~8,129 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 137 nodes · 191 edges · 13 communities (8 shown, 5 thin omitted)
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
4. `react` - 9 edges
5. `scripts` - 5 edges
6. `lucide-react` - 5 edges
7. `GraphPage()` - 5 edges
8. `SynthesisDrawer()` - 5 edges
9. `ClusterCardsGrid()` - 4 edges
10. `Header()` - 4 edges

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

## Communities (13 total, 5 thin omitted)

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
Cohesion: 0.18
Nodes (12): react-force-graph-2d, ConstellationCanvas, GraphPage(), ConstellationCanvas(), ConstellationCanvasProps, ForceGraph2D, GraphLink, GraphNode (+4 more)

### Community 5 - "react"
Cohesion: 0.24
Nodes (11): lucide-react, react, DashboardPage(), ClusterCardsGrid(), ClusterData, ClusterItem, Highlight, PinnedShelf() (+3 more)

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
- **65 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+60 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 78 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `package.json`, `layout.tsx`, `graph/page.tsx`, `react`?**
  _High betweenness centrality (0.254) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _65 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `package.json`, `graph/page.tsx`, `ingest-router.ts`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._