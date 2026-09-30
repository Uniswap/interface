#!/usr/bin/env bun
/**
 * Prints the Vercel-deployable projects affected by a git diff as a GitHub
 * Actions matrix (JSON array on stdout; all logging goes to stderr).
 *
 * Used by .github/workflows/vercel_deploy.yml — the CI replacement for
 * Vercel's git-integration auto-deploys (each project's vercel.json sets
 * git.deploymentEnabled: false so pushes stop creating deployments; this
 * script decides which projects a change actually needs to deploy).
 *
 * Base ref resolution, in priority order:
 *   1. $VERCEL_AFFECTED_BASE — set by the workflow on pushes to main (the
 *      push event's `before` SHA), where origin/main..HEAD would be empty.
 *      If set but unresolvable (all-zeros SHA, force-push, GC'd commit),
 *      fail-open and emit every project — falling back to origin/main would
 *      yield an empty diff on a main push and deploy nothing.
 *   2. origin/main
 *   3. main
 *
 * $VERCEL_AFFECTED_ALL=true skips detection and emits every project — the
 * workflow_dispatch lever for redeploying after a transient failure.
 *
 * $VERCEL_AFFECTED_PROJECTS (comma/space-separated Vercel project names)
 * skips detection and emits exactly the named projects — the scoped
 * workflow_dispatch lever for redeploying a single project on demand. Unlike
 * detection failures this is an explicit operator input, so unknown names
 * fail the run (exit 1) instead of failing open: a typo must not deploy
 * every project to production.
 *
 * Fail-open: if detection breaks (no base ref, git/NX errors), every project
 * is emitted — an unnecessary deploy beats a silently missing one. Same
 * stance as scripts/vercel-ignore.ts.
 *
 * Usage:
 *   bun scripts/vercel-affected.ts
 *   VERCEL_AFFECTED_BASE=<sha> bun scripts/vercel-affected.ts
 */

import { $ } from 'bun'
import { labsProjectDirs } from './vercel-labs-project-dirs'

export type DeployableProject = {
  /** NX project name; display name for projects outside the NX graph */
  name: string
  /** Vercel project name (dashboard) */
  vercelProject: string
  /**
   * Vercel project ID. Not a secret (it ships in .vercel/project.json on
   * every linked checkout) — inlining it lets CI deploy without a
   * per-project ID secret.
   */
  projectId: string
  /**
   * For labs/ projects outside the NX graph (.nxignore'd): directories whose
   * changes require a redeploy (from the shared labsProjectDirs mapping).
   * Projects without dirs use NX affected.
   */
  dirs?: string[]
}

const DEPLOYABLE_PROJECTS: DeployableProject[] = [
  {
    name: '@universe/workbench',
    vercelProject: 'workbench',
    projectId: 'prj_Wx34EkYgyI0A8C3YdXsoLkiidOdh',
    dirs: labsProjectDirs['@universe/workbench'],
  },
  {
    name: '@universe/sandbox',
    vercelProject: 'sandbox',
    projectId: 'prj_p6uzKC6v0hrzPVb3F9bdB8P6DDRt',
    dirs: labsProjectDirs['@universe/sandbox'],
  },
  {
    name: '@universe/rh-cca',
    vercelProject: 'universe-rh-cca',
    projectId: 'prj_pzxwKP6jDElhfM0KGs1vsXhwgwmx',
    dirs: labsProjectDirs['@universe/rh-cca'],
  },
  {
    name: '@universe/dev-portal',
    vercelProject: 'dev-portal',
    projectId: 'prj_ZUGIdLPpK4CSWPXPhGBZhfdlDD1f',
  },
  // mission-control is intentionally absent: its session backend is only
  // reachable from inside the VPC, so a Vercel preview cannot log in.
]

// stdout is reserved for the JSON matrix
function log(message: string): void {
  console.error(message)
}

type RequestedSelection =
  | { kind: 'none' }
  | { kind: 'unknown'; unknown: string[] }
  | { kind: 'selected'; selected: DeployableProject[] }

/**
 * Resolves $VERCEL_AFFECTED_PROJECTS (comma/space-separated Vercel project
 * names) against the registry. Fail-closed: ANY unknown name yields 'unknown'
 * (even alongside valid ones) — an explicit operator input must never
 * fail-open into deploying everything.
 */
export function selectRequestedProjects(raw: string | undefined, projects: DeployableProject[]): RequestedSelection {
  const requested = (raw ?? '').split(/[\s,]+/).filter((name) => name.length > 0)
  if (requested.length === 0) {
    return { kind: 'none' }
  }
  const unknown = requested.filter((name) => !projects.some((p) => p.vercelProject === name))
  if (unknown.length > 0) {
    return { kind: 'unknown', unknown }
  }
  return { kind: 'selected', selected: projects.filter((p) => requested.includes(p.vercelProject)) }
}

function emit(projects: DeployableProject[]): never {
  // name/dirs are detection detail — the workflow matrix only needs the keys it reads
  const matrix = projects.map(({ vercelProject, projectId }) => ({ vercelProject, projectId }))
  console.log(JSON.stringify(matrix))
  process.exit(0)
}

async function resolveBase(): Promise<string | null> {
  const explicit = process.env.VERCEL_AFFECTED_BASE
  if (explicit) {
    // ^{commit} forces an object-existence check — bare --verify accepts any
    // 40-hex string (e.g. the all-zeros `before` SHA) without one.
    const check = await $`git rev-parse --verify ${explicit}^{commit}`.quiet().nothrow()
    if (check.exitCode === 0) {
      return explicit
    }
    // An explicit base is only set on pushes to main, where HEAD == origin/main:
    // falling back to the default refs would diff nothing and deploy nothing.
    log(`Explicit base "${explicit}" is not resolvable — fail-open, emitting every project`)
    emit(DEPLOYABLE_PROJECTS)
  }
  for (const ref of ['origin/main', 'main']) {
    const check = await $`git rev-parse --verify ${ref}`.quiet().nothrow()
    if (check.exitCode === 0) {
      return ref
    }
  }
  return null
}

async function main(): Promise<void> {
  const selection = selectRequestedProjects(process.env.VERCEL_AFFECTED_PROJECTS, DEPLOYABLE_PROJECTS)
  if (selection.kind === 'unknown') {
    log(
      `Unknown Vercel project(s) in $VERCEL_AFFECTED_PROJECTS: ${selection.unknown.join(', ')} ` +
        `(known: ${DEPLOYABLE_PROJECTS.map((p) => p.vercelProject).join(', ')}) — failing closed`,
    )
    process.exit(1)
  }
  if (selection.kind === 'selected') {
    log(
      `VERCEL_AFFECTED_PROJECTS=${selection.selected.map((p) => p.vercelProject).join(',')} — emitting only the requested project(s)`,
    )
    return emit(selection.selected)
  }

  if (process.env.VERCEL_AFFECTED_ALL === 'true') {
    log('VERCEL_AFFECTED_ALL=true — emitting every deployable project')
    emit(DEPLOYABLE_PROJECTS)
  }

  const base = await resolveBase()
  if (!base) {
    log('No usable base ref (tried $VERCEL_AFFECTED_BASE, origin/main, main) — fail-open, emitting every project')
    emit(DEPLOYABLE_PROJECTS)
  }
  log(`Base: ${base}`)

  const diff = await $`git diff --name-only ${base}..HEAD`.quiet().nothrow()
  if (diff.exitCode !== 0) {
    log(`git diff failed (exit ${diff.exitCode}) — fail-open, emitting every project`)
    emit(DEPLOYABLE_PROJECTS)
  }
  const changedFiles = diff.stdout
    .toString()
    .trim()
    .split('\n')
    .filter((f) => f.length > 0)
  log(`Changed files (${base}..HEAD): ${changedFiles.length}`)

  // One NX affected pass shared by every NX-graph project in the registry.
  // null = detection failed → fail-open for those projects.
  let nxAffected: string[] | null = null
  if (DEPLOYABLE_PROJECTS.some((p) => !p.dirs)) {
    const result = await $`bunx nx show projects --affected --base=${base} --head=HEAD`.quiet().nothrow()
    if (result.exitCode === 0) {
      nxAffected = result.stdout
        .toString()
        .trim()
        .split('\n')
        .filter((p) => p.length > 0)
      log(`NX affected projects: ${nxAffected.join(', ') || '(none)'}`)
    } else {
      log(`NX affected detection failed (exit ${result.exitCode}) — fail-open for NX-graph projects`)
      log(result.stderr.toString().trim())
    }
  }

  const affected = DEPLOYABLE_PROJECTS.filter((project) => {
    if (project.dirs) {
      const dirs = project.dirs
      return changedFiles.some((file) => dirs.some((dir) => file.startsWith(dir)))
    }
    return nxAffected === null || nxAffected.includes(project.name)
  })

  log(`Deployable projects affected: ${affected.map((p) => p.vercelProject).join(', ') || '(none)'}`)
  emit(affected)
}

if (import.meta.main) {
  main()
}
