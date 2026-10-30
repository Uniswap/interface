/**
 * Tests for the $VERCEL_AFFECTED_PROJECTS selection behind
 * scripts/vercel-affected.ts (INFRA-3305): the scoped workflow_dispatch lever
 * must emit exactly the named projects and fail CLOSED on unknown names. Also
 * the production filter that keeps `previewOnly` projects off main.
 * Run with `bun test scripts/vercel-affected`.
 */
import { describe, expect, test } from 'bun:test'
import {
  DEPLOYABLE_PROJECTS,
  type DeployableProject,
  deployableForTarget,
  selectRequestedProjects,
  toMatrix,
} from './vercel-affected'

const PROJECTS: DeployableProject[] = [
  { name: '@universe/workbench', vercelProject: 'workbench', projectId: 'prj_workbench' },
  { name: '@universe/sandbox', vercelProject: 'sandbox', projectId: 'prj_sandbox' },
  { name: '@universe/dev-portal', vercelProject: 'dev-portal', projectId: 'prj_devportal' },
]

describe('selectRequestedProjects', () => {
  // Empty means "input not set": main() must fall through to affected
  // detection (or VERCEL_AFFECTED_ALL), never emit an empty matrix.
  test.each([
    ['undefined', undefined],
    ['empty string', ''],
    ['whitespace only', '  '],
    ['separators only', ' , ,'],
  ])('no selection for %s input', (_label, raw) => {
    expect(selectRequestedProjects(raw, PROJECTS)).toEqual({ kind: 'none' })
  })

  test.each([
    ['single name', 'workbench', ['workbench']],
    ['comma separated', 'workbench,sandbox', ['workbench', 'sandbox']],
    ['comma + space separated', 'workbench, dev-portal', ['workbench', 'dev-portal']],
    ['space separated', 'sandbox workbench', ['workbench', 'sandbox']],
  ])('selects exactly the named projects: %s', (_label, raw, expected) => {
    const selection = selectRequestedProjects(raw, PROJECTS)
    if (selection.kind !== 'selected') {
      throw new Error(`expected 'selected', got '${selection.kind}'`)
    }
    // Registry order, not input order — the matrix shape must not depend on
    // how the operator happened to type the list.
    expect(selection.selected.map((p) => p.vercelProject)).toEqual(expected)
  })

  test('unknown name fails closed', () => {
    expect(selectRequestedProjects('webench', PROJECTS)).toEqual({ kind: 'unknown', unknown: ['webench'] })
  })

  test('unknown name alongside valid ones still fails closed', () => {
    // A typo in a multi-project dispatch must not quietly deploy the valid
    // subset (or worse, fall through to everything).
    expect(selectRequestedProjects('workbench,webench', PROJECTS)).toEqual({ kind: 'unknown', unknown: ['webench'] })
  })

  test('names are case-sensitive and never fuzzy-matched', () => {
    expect(selectRequestedProjects('Workbench', PROJECTS)).toEqual({ kind: 'unknown', unknown: ['Workbench'] })
  })
})

describe('deployableForTarget', () => {
  const withPreviewOnly: DeployableProject[] = [
    ...PROJECTS,
    { name: '@universe/rh-cca', vercelProject: 'universe-rh-cca', projectId: 'prj_rhcca', previewOnly: true },
  ]

  test('drops preview-only projects from a production run', () => {
    expect(deployableForTarget(withPreviewOnly, true).map((p) => p.vercelProject)).toEqual([
      'workbench',
      'sandbox',
      'dev-portal',
    ])
  })

  test('keeps them for a preview run', () => {
    expect(deployableForTarget(withPreviewOnly, false)).toEqual(withPreviewOnly)
  })
})

describe('the universe-rh-cca registry entry', () => {
  // The fixtures above prove the mechanisms; this pins the real entry, the
  // one an edit to its block (a rename or path move) could silently drop
  // flags from.
  const rhCca = DEPLOYABLE_PROJECTS.find((project) => project.vercelProject === 'universe-rh-cca')

  test('never deploys to production', () => {
    expect(rhCca?.previewOnly).toBe(true)
    expect(deployableForTarget(DEPLOYABLE_PROJECTS, true).map((p) => p.vercelProject)).not.toContain('universe-rh-cca')
  })

  test('builds from the directory the repo keeps it in', () => {
    expect(rhCca?.rootDirectory).toBe('apps/pools-xyz')
  })
})

describe('toMatrix', () => {
  test('carries rootDirectory only for projects that set one', () => {
    const projects: DeployableProject[] = [
      ...PROJECTS.slice(0, 1),
      {
        name: '@universe/rh-cca',
        vercelProject: 'universe-rh-cca',
        projectId: 'prj_rhcca',
        dirs: ['apps/pools-xyz/'],
        rootDirectory: 'apps/pools-xyz',
      },
    ]
    expect(toMatrix(projects)).toStrictEqual([
      { vercelProject: 'workbench', projectId: 'prj_workbench' },
      { vercelProject: 'universe-rh-cca', projectId: 'prj_rhcca', rootDirectory: 'apps/pools-xyz' },
    ])
  })
})
