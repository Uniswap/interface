import { act, renderHook } from '@testing-library/react'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Provider } from 'jotai'
import { createElement, type ReactNode } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePositionFilters } from '~/pages/Positions/hooks/usePositionFilters'

// Each renderHook gets its own isolated atom store via a fresh <Provider>
// so previous tests can't leak default-store state into later ones.
function renderUsePositionFilters() {
  const wrapper = ({ children }: { children: ReactNode }) => createElement(Provider, null, children)
  return renderHook(() => usePositionFilters(), { wrapper })
}

describe('usePositionFilters', () => {
  it('exposes default filter values', () => {
    const { result } = renderUsePositionFilters()

    expect(result.current.chainFilter).toBeNull()
    expect(result.current.versionFilter).toEqual([ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2])
    expect(result.current.statusFilter).toEqual([PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE])
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
})
