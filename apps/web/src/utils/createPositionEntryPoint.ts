import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { isSVMAddress } from 'utilities/src/addresses/svm/svm'

export enum EntryPointKind {
  ExplorePoolDetail = 'explore-pool-detail',
  ExplorePools = 'explore-pools',
  PortfolioPools = 'portfolio-pools',
  None = 'none',
}

export type ParsedEntryPoint =
  | {
      kind: EntryPointKind.ExplorePoolDetail | EntryPointKind.ExplorePools | EntryPointKind.PortfolioPools
      to: string
    }
  | { kind: EntryPointKind.None; to: null }

function isSafeInternalPath(entryPoint: string): boolean {
  return entryPoint.startsWith('/') && !entryPoint.startsWith('//')
}

function stripSearch(entryPoint: string): string {
  return entryPoint.split('?')[0]
}

function hasPathTraversal(path: string): boolean {
  return path.split('/').includes('..')
}

function isPortfolioPoolsPath(path: string): boolean {
  if (path === '/portfolio/pools') {
    return true
  }

  const segments = path.split('/').filter(Boolean)
  if (segments.length !== 3 || segments[0] !== 'portfolio' || segments[2] !== 'pools') {
    return false
  }

  const address = segments[1]
  return isEVMAddress(address) || isSVMAddress(address)
}

function isExplorePoolDetailPath(path: string): boolean {
  const poolDetailPrefix = '/explore/pools/'
  return path.startsWith(poolDetailPrefix) && path.slice(poolDetailPrefix.length).length > 0
}

export function parseEntryPoint(entryPoint?: string | null): ParsedEntryPoint {
  if (!entryPoint || !isSafeInternalPath(entryPoint)) {
    return { kind: EntryPointKind.None, to: null }
  }

  const path = stripSearch(entryPoint)
  if (hasPathTraversal(path)) {
    return { kind: EntryPointKind.None, to: null }
  }

  if (isExplorePoolDetailPath(path)) {
    return { kind: EntryPointKind.ExplorePoolDetail, to: entryPoint }
  }
  if (path === '/explore/pools') {
    return { kind: EntryPointKind.ExplorePools, to: '/explore/pools' }
  }
  if (isPortfolioPoolsPath(path)) {
    return { kind: EntryPointKind.PortfolioPools, to: entryPoint }
  }

  return { kind: EntryPointKind.None, to: null }
}

export function parseEntryPointFromSearch(search: string): ParsedEntryPoint {
  return parseEntryPoint(new URLSearchParams(search).get('entryPoint'))
}

export function parseEntryPointFromState(state: unknown): ParsedEntryPoint {
  if (!state || typeof state !== 'object') {
    return parseEntryPoint()
  }

  const maybeState = state as { entryPoint?: unknown; from?: unknown }
  if (typeof maybeState.entryPoint === 'string') {
    return parseEntryPoint(maybeState.entryPoint)
  }
  // `state.from` is the legacy navigation convention used by `PoolDetailsStatsButtons`
  // (and possibly other surfaces) that set only `from` rather than `entryPoint`.
  if (typeof maybeState.from === 'string') {
    return parseEntryPoint(maybeState.from)
  }

  return parseEntryPoint()
}

export function resolveEntryPoint({ search, state }: { search: string; state: unknown }): ParsedEntryPoint {
  const queryEntryPoint = parseEntryPointFromSearch(search)
  return queryEntryPoint.kind === EntryPointKind.None ? parseEntryPointFromState(state) : queryEntryPoint
}
