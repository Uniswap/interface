import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useMemo } from 'react'
import {
  DEFAULT_LP_POSITION_PROTOCOL_FILTER,
  DEFAULT_LP_POSITION_STATUS_FILTER,
  LP_POSITION_PROTOCOL_VERSIONS,
  LP_POSITION_STATUS_FILTER_OPTIONS,
} from '~/features/Liquidity/constants'
import { parseAsChainId } from '~/features/Liquidity/parsers/urlParsers'

// Position filters live in the URL (nuqs) rather than in-memory state so they survive navigating into
// a position and back, and are shareable/reload-safe. `history: 'replace'` keeps each filter tweak out
// of the back stack. ProtocolVersion/PositionStatus are numeric enums, so integer array parsers apply.
const positionFiltersParser = {
  chain: parseAsChainId,
  versions: parseAsArrayOf(parseAsInteger).withDefault([...DEFAULT_LP_POSITION_PROTOCOL_FILTER]),
  status: parseAsArrayOf(parseAsInteger).withDefault([...DEFAULT_LP_POSITION_STATUS_FILTER]),
  search: parseAsString.withDefault(''),
}

// The only status sets the V2 range tabs can render (All / In range / Out of range).
const RANGE_TAB_SELECTIONS: PositionStatus[][] = [
  [...DEFAULT_LP_POSITION_STATUS_FILTER],
  [PositionStatus.IN_RANGE],
  [PositionStatus.OUT_OF_RANGE],
]

function isRangeTabSelection(status: number[]): boolean {
  return RANGE_TAB_SELECTIONS.some((tab) => tab.length === status.length && tab.every((s) => status.includes(s)))
}

// The integer parser accepts any number from the URL, so drop values outside the enum before they reach
// the request or the control-bar chips (e.g. `?versions=999`). The request sends `versions` as-is and the
// liquidity service reads an empty list as every version, so an empty result (`?versions=`, or only
// out-of-enum values) reads as every version too, keeping the Protocol label and checkboxes truthful.
function toVersionFilter(versions: number[]): ProtocolVersion[] {
  const valid = versions.filter((v): v is ProtocolVersion => (LP_POSITION_PROTOCOL_VERSIONS as number[]).includes(v))
  return valid.length > 0 ? valid : [...DEFAULT_LP_POSITION_PROTOCOL_FILTER]
}

export interface UsePositionFiltersResult {
  chainFilter: UniverseChainId | null
  setChainFilter: (id: UniverseChainId | null) => void
  versionFilter: ProtocolVersion[]
  toggleVersion: (version: ProtocolVersion) => void
  statusFilter: PositionStatus[]
  toggleStatus: (status: PositionStatus) => void
  setStatusFilter: (statuses: PositionStatus[]) => void
  search: string
  setSearch: (search: string) => void
  resetFilters: () => void
}

export function usePositionFilters(): UsePositionFiltersResult {
  const [{ chain, versions, status, search }, setFilters] = useQueryStates(positionFiltersParser, {
    history: 'replace',
  })

  // The integer parsers accept any number from the URL, so drop out-of-enum values (see toVersionFilter).
  // Memoized so the derived arrays stay referentially stable while the raw params are unchanged.
  const versionFilter = useMemo(() => toVersionFilter(versions), [versions])
  const statusFilter = useMemo(
    () => status.filter((s): s is PositionStatus => (LP_POSITION_STATUS_FILTER_OPTIONS as number[]).includes(s)),
    [status],
  )

  const setChainFilter = useCallback(
    (id: UniverseChainId | null) => {
      void setFilters({ chain: id })
    },
    [setFilters],
  )

  const toggleVersion = useCallback(
    (version: ProtocolVersion) => {
      void setFilters((prev) => {
        // Toggle against what the checkboxes show, not the raw param, so `?versions=` unchecks rather than adds.
        const current = toVersionFilter(prev.versions)
        if (!current.includes(version)) {
          return { versions: [...current, version] }
        }
        const next = current.filter((v) => v !== version)
        // Keep at least one version selected: an empty list is fetched as every version.
        return next.length > 0 ? { versions: next } : {}
      })
    },
    [setFilters],
  )

  const toggleStatus = useCallback(
    (statusValue: PositionStatus) => {
      void setFilters((prev) => ({
        status: prev.status.includes(statusValue)
          ? prev.status.filter((s) => s !== statusValue)
          : [...prev.status, statusValue],
      }))
    },
    [setFilters],
  )

  const setStatusFilter = useCallback(
    (statuses: PositionStatus[]) => {
      void setFilters({ status: statuses })
    },
    [setFilters],
  )

  const setSearch = useCallback(
    (value: string) => {
      // Empty string clears the param (null restores the withDefault ''), keeping a blank search out of the URL.
      void setFilters({ search: value.trim() ? value : null })
    },
    [setFilters],
  )

  // null removes the param (restores the withDefault value). A tab-representable `status` is
  // navigation, not a filter, so it survives a clear — but values the tabs can't render
  // (hand-edited URLs) have no other in-UI reset, so heal them.
  const resetFilters = useCallback(() => {
    void setFilters((prev) => ({
      chain: null,
      versions: null,
      search: null,
      ...(isRangeTabSelection(prev.status) ? {} : { status: null }),
    }))
  }, [setFilters])

  return {
    chainFilter: chain,
    setChainFilter,
    versionFilter,
    toggleVersion,
    statusFilter,
    toggleStatus,
    setStatusFilter,
    search,
    setSearch,
    resetFilters,
  }
}
