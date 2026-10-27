# Ruflo Self-Analysis Report

**Date:** March 16, 2026
**Method:** Ruflo v3.5.15 analyzing its own codebase
**Scope:** `v3/@claude-flow/cli/src/` (core CLI source)

---

## Executive Summary

Ruflo analyzed itself using its own analysis, security, benchmark, and diagnostic tools.
The codebase has **extreme complexity** (average cyclomatic: 59), **114 security issues**
(mostly dependency CVEs), and **705 functions** across 169 files. The hooks.ts command
file alone has cyclomatic complexity 414 — the highest in the project.

---

## 1. Health Check (doctor)

| Check | Status |
|-------|--------|
| Version | v3.5.15 (latest: v3.5.17 — slightly behind) |
| Node.js | v24.0.0 (>= 20 required) |
| TypeScript | v5.9.3 |
| agentic-flow | v2.0.7 (ReasoningBank, Router, QUIC) |
| Memory DB | .swarm/memory.db (0.14 MB) |
| Disk Space | 222 GB available |
| **Result** | 9 passed, 5 warnings |

---

## 2. Complexity Analysis

**169 files scanned, 82 flagged (48% above threshold of 20)**
**Average cyclomatic complexity: 59** (extremely high — typical target is <15)

### Top 10 Most Complex Files

| File | Cyclomatic | Cognitive | LOC | Rating |
|------|-----------|-----------|-----|--------|
| commands/hooks.ts | 414 | 1,176 | 4,144 | Very Complex |
| memory/memory-initializer.ts | 241 | 524 | 2,280 | Very Complex |
| memory/memory-bridge.ts | 213 | 407 | 1,589 | Very Complex |
| commands/analyze.ts | 205 | 635 | 1,870 | Very Complex |
| init/execute-helpers.ts | 205 | 484 | 1,661 | Very Complex |
| mcp-tools/hooks-tools.ts | 189 | 500 | 3,047 | Very Complex |
| commands/neural.ts | 170 | 647 | 1,499 | Very Complex |
| init/helpers-generator.ts | 148 | 401 | 1,060 | Very Complex |
| commands/hive-mind.ts | 143 | 308 | 1,257 | Very Complex |
| commands/embeddings.ts | 140 | 406 | 1,543 | Very Complex |

**Observation:** hooks.ts has cognitive complexity of 1,176 — meaning a developer would
need to hold ~1,176 mental "branches" to understand the full file. This is ~80x the
recommended maximum of 15.

---

## 3. Symbol Extraction

| Metric | Count |
|--------|-------|
| Total functions | 705 |
| Total files | 169 |
| Avg functions/file | 4.2 |

---

## 4. External Dependencies

| Uses | Import | Type |
|------|--------|------|
| 30 | path | Node.js core |
| 23 | fs | Node.js core |
| 21 | node:path | Node.js core |
| 17 | node:fs | Node.js core |
| 7 | url | Node.js core |
| 6 | node:fs/promises | Node.js core |
| 5 | child_process | Node.js core |
| 4 | node:os | Node.js core |
| 3 | node:crypto | Node.js core |
| 1 | @claude-flow/shared | Internal |

**Observation:** Minimal external npm dependencies in the CLI source itself — mostly
Node.js built-ins. The heavy dependencies (onnxruntime, sql.js, agentdb) are imported
dynamically at runtime.

---

## 5. Security Scan

**Total issues: 114** (0 Critical, 81 High, 31 Medium, 2 Low)

### Hardcoded Secrets (2 found)

| Severity | Location | Type |
|----------|----------|------|
| HIGH | v2/bin/init/templates/ | Hardcoded Password |
| HIGH | v2/examples/05-swarm-a... | Hardcoded Password |

Both are in **v2 legacy code** (templates/examples), not in the active v3 codebase.

### Dependency CVEs (18 packages flagged)

| Severity | Package | Issue |
|----------|---------|-------|
| HIGH | @hono/node-server | Authorization bypass |
| HIGH | express-rate-limit | IPv4-mapped IPv6 bypass |
| HIGH | flatted | Unbounded recursion |
| HIGH | undici | WebSocket 64-bit frame handling |
| HIGH | tar | Arbitrary file overwrite |
| HIGH | sqlite3 | Vulnerability |
| HIGH | make-fetch-happen | Vulnerability |
| HIGH | hono | Cookie attribute vulnerability |
| MEDIUM | esbuild | Cross-site data exfiltration |
| MEDIUM | file-type | Infinite loop |
| MEDIUM | vite/vitest/vite-node | Vulnerability |

**Recommendation:** Run `npm audit fix` to address non-breaking fixes.

---

## 6. Performance Benchmark (100 iterations)

| Operation | Mean | P95 | P99 | Status |
|-----------|------|-----|-----|--------|
| Embedding Gen | 19.33ms | 31.57ms | 37.63ms | Below target (WASM fallback) |
| Flash Attention | 0.484ms | 0.967ms | 9.041ms | 0.10x |
| SONA Adaptation | 2.64us | 68.18us | 68.18us | <0.05ms |
| Memory Store+Embed | 0.0ms | 0.1ms | 0.4ms | Target met |

**Note:** ONNX native runtime failed with DefaultLogger error — fell back to WASM.
Embedding generation is ~5.5x slower in WASM mode (19.33ms vs ~3.5ms native).
Total benchmark: 5.13s for 100 iterations.

---

## 7. Memory System

| Metric | Value |
|--------|-------|
| Backend | sql.js + HNSW |
| Version | 3.0.0 |
| Total Entries | 0 (fresh clone) |

---

## 8. Graph Analysis (ran but timed out on large codebase)

The following analyses were started but took >60s on 169 files:
- Dependency graph
- Circular dependency detection
- Module community detection (Louvain)
- Code boundary detection (MinCut)

**This itself is a performance finding** — the graph analysis tools don't scale well
to 169-file codebases with 700+ functions. They work fine on smaller projects
(e.g., promptplaybook dashboard with 27 files).

---

## 9. Key Findings

### Strengths
- Minimal external dependencies (mostly Node.js built-ins)
- Dynamic imports for heavy deps (good startup performance)
- SONA adaptation at 2.64us (sub-microsecond)
- Memory store at 0.0ms mean (extremely fast)

### Issues

| Priority | Issue | Impact |
|----------|-------|--------|
| P0 | hooks.ts at 4,144 LOC / complexity 414 | Unmaintainable — needs splitting into 10+ files |
| P0 | 81 HIGH severity dependency CVEs | Security risk — run npm audit fix |
| P1 | 82 of 169 files above complexity threshold | 48% of codebase exceeds recommended complexity |
| P1 | ONNX native runtime fails (DefaultLogger) | Falls back to WASM, 5.5x slower embeddings |
| P1 | Graph analysis doesn't scale to 169 files | Timeouts on circular/module/boundary detection |
| P2 | 2 hardcoded passwords in v2 templates | Legacy code — should be removed or parameterized |
| P2 | Average complexity 59 (target: <15) | 4x above recommended, makes contributions hard |
| P3 | Inconsistent path imports (path vs node:path) | 30 uses of `path`, 21 of `node:path` — pick one |

### Refactoring Priorities

1. **Split hooks.ts** (4,144 lines) into:
   - hooks-pretrain.ts, hooks-routing.ts, hooks-session.ts, hooks-intelligence.ts,
     hooks-workers.ts, hooks-model-routing.ts, hooks-coverage.ts, hooks-token.ts

2. **Split memory-initializer.ts** (2,280 lines) into:
   - memory-sqlite.ts, memory-hnsw.ts, memory-migration.ts, memory-config.ts

3. **Fix ONNX runtime** — investigate DefaultLogger error to get native performance back

---

## Meta-Analysis: How Well Did Ruflo Analyze Itself?

| Analysis Tool | Worked? | Quality |
|---------------|---------|---------|
| Complexity | Yes | Excellent — real file-by-file cyclomatic/cognitive scoring |
| Symbols | Yes | Accurate — 705 functions found |
| Imports | Yes | Correct — 22 unique external imports |
| Security scan | Yes | Found real CVEs + hardcoded passwords |
| Benchmark | Yes | Real measurements (discovered ONNX fallback issue) |
| Doctor | Yes | Accurate health check |
| Memory stats | Yes | Correct for fresh install |
| Dependencies graph | Timeout | Doesn't scale to 169 files |
| Circular deps | Timeout | Doesn't scale to 169 files |
| Module detection | Timeout | Doesn't scale to 169 files |
| Boundary detection | Timeout | Doesn't scale to 169 files |

**Verdict:** Ruflo's analysis tools work well for small-to-medium projects (20-50 files)
but struggle with its own 169-file codebase on graph-based operations. The complexity,
security, and benchmark tools scale fine.
