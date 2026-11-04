import { act, renderHook } from '@testing-library/react'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { DEFAULT_LP_POSITION_PROTOCOL_FILTER, DEFAULT_LP_POSITION_STATUS_FILTER } from '~/features/Liquidity/constants'
import { usePositionFilters } from '~/pages/Positions/hooks/usePositionFilters'

// Each renderHook gets a fresh nuqs testing adapter (empty URL) so filters start at their defaults
// and previous tests can't leak query-state into later ones.
function renderUsePositionFilters(searchParams?: string) {
  return renderHook(() => usePositionFilters(), { wrapper: withNuqsTestingAdapter({ searchParams }) })
}

describe('usePositionFilters', () => {
  it('exposes default filter values', () => {
    const { result } = renderUsePositionFilters()

    expect(result.current.chainFilter).toBeNull()
    expect(result.current.versionFilter).toEqual(DEFAULT_LP_POSITION_PROTOCOL_FILTER)
    expect(result.current.statusFilter).toEqual(DEFAULT_LP_POSITION_STATUS_FILTER)
    expect(result.current.search).toBe('')
  })

  it('updates search via setSearch and clears it back to empty', () => {
    const { result } = renderUsePositionFilters()

    act(() => result.current.setSearch('usdc'))
    expect(result.current.search).toBe('usdc')

    act(() => result.current.setSearch(''))
    expect(result.current.search).toBe('')
  })

  it('reads an initial search value from the URL', () => {
    const { result } = renderUsePositionFilters('?search=eth')

    expect(result.current.search).toBe('eth')
  })

  it('updates chainFilter via setChainFilter', () => {
    const { result } = renderUsePositionFilters()

    act(() => result.current.setChainFilter(UniverseChainId.Mainnet))

    expect(result.current.chainFilter).toBe(UniverseChainId.Mainnet)
  })

  it('clears chainFilter when setChainFilter receives null', () => {
    const { result } = renderUsePositionFilters()

    act(() => result.current.setChainFilter(UniverseChainId.Mainnet))
    act(() => result.current.setChainFilter(null))

    expect(result.current.chainFilter).toBeNull()
  })

  it('toggleVersion removes a version that was present', () => {
    const { result } = renderUsePositionFilters()

    act(() => result.current.toggleVersion(ProtocolVersion.V2))

    expect(result.current.versionFilter).toEqual([ProtocolVersion.V4, ProtocolVersion.V3])
  })

  it('toggleVersion keeps the last selected version', () => {
    const { result } = renderUsePositionFilters()

    act(() => result.current.toggleVersion(ProtocolVersion.V2))
    act(() => result.current.toggleVersion(ProtocolVersion.V3))
    act(() => result.current.toggleVersion(ProtocolVersion.V4))

    expect(result.current.versionFilter).toEqual([ProtocolVersion.V4])
  })

  it('reads an empty or all-invalid versions param as every version, which is what it fetches', () => {
    expect(renderUsePositionFilters('?versions=').result.current.versionFilter).toEqual(
      DEFAULT_LP_POSITION_PROTOCOL_FILTER,
    )
    expect(renderUsePositionFilters('?versions=999').result.current.versionFilter).toEqual(
      DEFAULT_LP_POSITION_PROTOCOL_FILTER,
    )
  })

  it('toggleVersion from an empty versions param unchecks the version, as the checkboxes show it checked', () => {
    const { result } = renderUsePositionFilters('?versions=')

    act(() => result.current.toggleVersion(ProtocolVersion.V4))

    expect(result.current.versionFilter).toEqual([ProtocolVersion.V3, ProtocolVersion.V2])
  })

  it('toggleVersion re-adds a version after removing it', () => {
    const { result } = renderUsePositionFilters()

    act(() => result.current.toggleVersion(ProtocolVersion.V2))
    act(() => result.current.toggleVersion(ProtocolVersion.V2))

    expect(result.current.versionFilter).toEqual([ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2])
  })

  it('toggleStatus adds a status that was absent', () => {
    const { result } = renderUsePositionFilters()

    act(() => result.current.toggleStatus(PositionStatus.CLOSED))

    expect(result.current.statusFilter).toEqual([
      PositionStatus.IN_RANGE,
      PositionStatus.OUT_OF_RANGE,
      PositionStatus.CLOSED,
    ])
  })

  it('toggleStatus removes a status that was present', () => {
    const { result } = renderUsePositionFilters()

    act(() => result.current.toggleStatus(PositionStatus.IN_RANGE))

    expect(result.current.statusFilter).toEqual([PositionStatus.OUT_OF_RANGE])
  })

  it('toggleVersion does not mutate statusFilter, and toggleStatus does not mutate versionFilter', () => {
    const { result } = renderUsePositionFilters()

    act(() => result.current.toggleVersion(ProtocolVersion.V2))
    act(() => result.current.toggleStatus(PositionStatus.CLOSED))

    expect(result.current.versionFilter).toEqual([ProtocolVersion.V4, ProtocolVersion.V3])
    expect(result.current.statusFilter).toEqual([
      PositionStatus.IN_RANGE,
      PositionStatus.OUT_OF_RANGE,
      PositionStatus.CLOSED,
    ])
  })

  it('resetFilters restores chain, versions, and search but keeps the range tab selection', () => {
    const { result } = renderUsePositionFilters()

    act(() => result.current.setChainFilter(UniverseChainId.Mainnet))
    act(() => result.current.toggleVersion(ProtocolVersion.V2))
    act(() => result.current.setStatusFilter([PositionStatus.IN_RANGE]))
    act(() => result.current.setSearch('usdc'))

    act(() => result.current.resetFilters())

    expect(result.current.chainFilter).toBeNull()
    expect(result.current.versionFilter).toEqual(DEFAULT_LP_POSITION_PROTOCOL_FILTER)
    expect(result.current.statusFilter).toEqual([PositionStatus.IN_RANGE])
    expect(result.current.search).toBe('')
  })

  it('resetFilters heals a status the range tabs cannot render', () => {
    const { result } = renderUsePositionFilters()

    act(() => result.current.toggleStatus(PositionStatus.CLOSED))

    act(() => result.current.resetFilters())

    expect(result.current.statusFilter).toEqual(DEFAULT_LP_POSITION_STATUS_FILTER)
  })

  it('toggleVersion uses a functional setter — captured handler from earlier render still applies relative to latest atom value', () => {
    const { result } = renderUsePositionFilters()

    // Capture toggleVersion from the first render BEFORE any mutation.
    const capturedToggle = result.current.toggleVersion

    // Mutate state via a different handler so the atom value diverges from
    // what the captured handler "saw" at capture time.
    act(() => result.current.toggleVersion(ProtocolVersion.V3))
    // versionFilter is now [V4, V2]

    // Invoke the captured handler — if the toggle closed over a stale snapshot,
    // it would re-derive against the original [V4, V3, V2] and produce a wrong array.
    // With a functional setter, it applies relative to the latest [V4, V2].
    act(() => capturedToggle(ProtocolVersion.V4))

    expect(result.current.versionFilter).toEqual([ProtocolVersion.V2])
  })

  it('drops URL version/status values that fall outside the enums', () => {
    const { result } = renderUsePositionFilters(
      `?versions=${ProtocolVersion.V4},999&status=${PositionStatus.CLOSED},42`,
    )

    expect(result.current.versionFilter).toEqual([ProtocolVersion.V4])
    expect(result.current.statusFilter).toEqual([PositionStatus.CLOSED])
  })
})
