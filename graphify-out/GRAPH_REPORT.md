# Graph Report - OmniBrain  (2026-10-31)

## Corpus Check
- 37 files · ~55,499 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 201 nodes · 328 edges · 16 communities (9 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c3861d9f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 🌌 OmniBrain
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
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `next` - 19 edges
2. `createServerClient()` - 18 edges
3. `getAuthUser()` - 17 edges
4. `compilerOptions` - 17 edges
5. `react` - 11 edges
6. `lucide-react` - 10 edges
7. `🌌 OmniBrain` - 9 edges
8. `Header()` - 8 edges
9. `ConstellationCanvas()` - 7 edges
10. `scripts` - 6 edges

## Surprising Connections (you probably didn't know these)
- `runTestSuite()` --calls--> `getClusterAnchor()`  [EXTRACTED]
  tests/layout-math.test.ts → src/lib/cluster-layout.ts
- `runTestSuite()` --calls--> `getSatelliteSlot()`  [EXTRACTED]
  tests/layout-math.test.ts → src/lib/cluster-layout.ts
- `runTestSuite()` --calls--> `doRectanglesOverlap()`  [EXTRACTED]
  tests/layout-math.test.ts → src/lib/cluster-layout.ts
- `runTestSuite()` --calls--> `getClusterDisplaySlots()`  [EXTRACTED]
  tests/layout-math.test.ts → src/lib/cluster-layout.ts
- `DELETE()` --calls--> `createServerClient()`  [EXTRACTED]
  src/app/api/highlights/route.ts → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (16 total, 7 thin omitted)

### Community 0 - "🌌 OmniBrain"
Cohesion: 0.10
Nodes (19): 1. Clone the repository, 1. ⚡ Universal Omni Ingestion Dock, 2. 💬 Conversational Semantic Search ("Ask OmniBrain"), 2. Install dependencies, 3. Configure environment variables (Optional for Demo Mode), 3. 📜 Light Paper Studio Mode, 4. 📑 Multi-Source OmniDoc Synthesis, 4. Run the development server (+11 more)

### Community 1 - "package.json"
Cohesion: 0.08
Nodes (21): name, private, scripts, build, dev, lint, start, test (+13 more)

### Community 2 - "next"
Cohesion: 0.17
Nodes (20): @google/generative-ai, next, GET(), SEED_CLUSTERS, PATCH(), GET(), SEED_GRAPH, DELETE() (+12 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 4 - "ConstellationCanvas.tsx"
Cohesion: 0.13
Nodes (25): ConstellationCanvas, GraphPage(), ConstellationCanvas(), ConstellationCanvasProps, drawRoundedRect(), ForceGraph2D, GraphLink, GraphNode (+17 more)

### Community 5 - "dashboard/page.tsx"
Cohesion: 0.11
Nodes (25): lucide-react, react, DashboardPage(), ClusterCardsGrid(), ClusterCardsGridProps, ClusterData, ClusterItem, Header() (+17 more)

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
- **95 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+90 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 110 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `package.json`, `layout.tsx`, `ConstellationCanvas.tsx`, `dashboard/page.tsx`?**
  _High betweenness centrality (0.238) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _95 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `🌌 OmniBrain` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Why does `react` connect `dashboard/page.tsx` to `package.json`, `ConstellationCanvas.tsx`, `ingest-router.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._