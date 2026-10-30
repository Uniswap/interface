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
 * $VERCEL_AFFECTED_PRODUCTION=true marks a production run (push to main, or
 * a dispatch on main): projects flagged `previewOnly` are dropped from it,
 * whichever path chose them.
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
  /** Deploy PR previews only, never a production deployment from main. */
  previewOnly?: true
  /**
   * Repo-relative directory the deploy job writes into the pulled
   * .vercel/project.json before `vercel build`, overriding the dashboard's
   * Root Directory, so each branch builds the app from where that branch
   * keeps it. `vercel deploy` still checks a non-empty dashboard value
   * against the checkout, so a project that sets this keeps that field empty.
   */
  rootDirectory?: string
}

export const DEPLOYABLE_PROJECTS: DeployableProject[] = [
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
    name: '@universe/pools-xyz',
    vercelProject: 'universe-rh-cca',
    projectId: 'prj_pzxwKP6jDElhfM0KGs1vsXhwgwmx',
    // Pools runs on ECS (dev.pools.xyz tracks main). A production build here
    // only served main against the prod backend behind Vercel SSO.
    previewOnly: true,
    rootDirectory: 'apps/pools-xyz',
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

/** Drops `previewOnly` projects from a production run. */
export function deployableForTarget(projects: DeployableProject[], production: boolean): DeployableProject[] {
  return production ? projects.filter((project) => !project.previewOnly) : projects
}

/** The keys the deploy job reads; name/dirs are detection detail. */
export function toMatrix(
  projects: DeployableProject[],
): { vercelProject: string; projectId: string; rootDirectory?: string }[] {
  return projects.map(({ vercelProject, projectId, rootDirectory }) =>
    rootDirectory === undefined ? { vercelProject, projectId } : { vercelProject, projectId, rootDirectory },
  )
}

function emit(projects: DeployableProject[]): never {
  const production = process.env.VERCEL_AFFECTED_PRODUCTION === 'true'
  const deployable = deployableForTarget(projects, production)
  const skipped = projects.filter((project) => !deployable.includes(project))
  if (skipped.length > 0) {
    log(`Production run — skipping preview-only project(s): ${skipped.map((p) => p.vercelProject).join(', ')}`)
  }
  console.log(JSON.stringify(toMatrix(deployable)))
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
