#!/usr/bin/env bun
/**
 * Do the e2e selection rules agree with the Casebook catalog? For every case that
 * names a code path and an e2e test, pretend its code paths changed and check that
 * the selector would run that test. A miss means the rules file is narrower than
 * the catalog's own claim about what covers what, and one of the two is wrong.
 *
 * Read-only, not wired into CI: run it when editing a rules file or a catalog area.
 *   bun scripts/e2e-affected-audit.ts            # every target
 *   TARGET=mobile bun scripts/e2e-affected-audit.ts
 * Needs the Nx graph: GRAPH_PATH defaults to /tmp/e2e-affected-graph.json, written
 * with `bunx nx graph --file=...` when missing.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createCasebookCtx } from '@universe/cli/src/casebook/main'
import {
  type AffectedMap,
  type NxGraphFile,
  TARGETS,
  dependencyRoots,
  listSpecs,
  resolveTarget,
  selectSpecs,
  withhold,
} from './e2e-affected'

const graphPath = process.env['GRAPH_PATH'] ?? '/tmp/e2e-affected-graph.json'
if (!existsSync(graphPath)) {
  execFileSync('bunx', ['nx', 'graph', `--file=${graphPath}`], {
    stdio: 'ignore',
    env: { ...process.env, NX_DAEMON: 'false' },
  })
}
const graph = JSON.parse(readFileSync(graphPath, 'utf8')) as NxGraphFile
const ctx = await createCasebookCtx(process.cwd())
const cases = await ctx.catalog.discoverScenarios()

/** A code path as one concrete changed file: a directory gets a file under it, a `Name.*` glob its `.ts`. */
function asChangedFile(codePath: string): string {
  if (codePath.endsWith('.*')) {
    return `${codePath.slice(0, -2)}.ts`
  }
  return codePath.endsWith('/') ? `${codePath}index.ts` : codePath
}

const names = process.env['TARGET'] ? [process.env['TARGET']] : Object.keys(TARGETS)
let totalMisses = 0
for (const name of names) {
  const target = resolveTarget(name)
  const map = JSON.parse(readFileSync(target.mapPath, 'utf8')) as AffectedMap
  const roots = dependencyRoots(graph, target.project)
  const all = listSpecs(target.specRoot, map.exclude ?? [], target.isSpec)
  const { specs, unstable, broken } = withhold(all, map, target.specRoot)
  const withheld = new Set([...unstable, ...broken])
  const specSet = new Set(all)
  const linked = cases.filter((c) => c.automationRefs.some((ref) => specSet.has(ref.path)))
  const misses: string[] = []
  let checked = 0
  for (const c of linked) {
    const refs = c.automationRefs.map((ref) => ref.path).filter((path) => specSet.has(path))
    const changedFiles = c.code_paths.map(asChangedFile)
    const selection = selectSpecs({
      target,
      runAll: false,
      changedFiles,
      specs,
      unstableSpecs: [...withheld],
      dependencyRoots: roots.dependencyRoots,
      projectRoots: roots.projectRoots,
      map,
    })
    const chosen = new Set(selection.mode === 'full' ? specs : selection.specs)
    for (const ref of refs) {
      checked += 1
      if (withheld.has(ref) || chosen.has(ref)) {
        continue
      }
      misses.push(`  ${c.id}: ${ref} not selected by ${c.code_paths.join(', ')} (${selection.mode})`)
    }
  }
  totalMisses += misses.length
  console.log(
    `${name}: ${linked.length} case(s) reference ${specSet.size} spec(s); ${checked} ref(s) checked, ${misses.length} miss(es)`,
  )
  for (const line of misses) {
    console.log(line)
  }
}
process.exitCode = totalMisses > 0 ? 1 : 0
