import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { useExploreParams } from '~/features/Explore/hooks/useExploreParams'
import { ExploreTab } from '~/types/explore'

function renderParams(path: string, routePath: string): ReturnType<typeof useExploreParams> {
  const { result } = renderHook(() => useExploreParams(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={children} />
        </Routes>
      </MemoryRouter>
    ),
  })
  return result.current
}

describe('useExploreParams', () => {
  it.each([ExploreTab.Pools, ExploreTab.Hooks])('recognizes the static %s route without a tab parameter', (tab) => {
    expect(renderParams(`/explore/${tab}`, `/explore/${tab}`)).toEqual({
      tab,
      chainName: undefined,
      tokenAddress: undefined,
    })
  })

  it.each([ExploreTab.Pools, ExploreTab.Hooks])('keeps the network from the static %s route', (tab) => {
    expect(renderParams(`/explore/${tab}/base`, `/explore/${tab}/:chainName`)).toEqual({
      tab,
      chainName: 'base',
      tokenAddress: undefined,
    })
  })

  it('recognizes Hooks through the generic Explore route used with the flag off', () => {
    expect(renderParams('/explore/hooks', '/explore/:tab')).toMatchObject({ tab: ExploreTab.Hooks })
    expect(renderParams('/explore/hooks/base', '/explore/:tab/:chainName')).toMatchObject({
      tab: ExploreTab.Hooks,
      chainName: 'base',
    })
  })

  it('preserves the bare Explore and legacy chain-only routes', () => {
    expect(renderParams('/explore', '/explore')).toEqual({
      tab: undefined,
      chainName: undefined,
      tokenAddress: undefined,
    })
    expect(renderParams('/explore/base', '/explore/:tab')).toEqual({
      tab: undefined,
      chainName: 'base',
      tokenAddress: undefined,
    })
  })

  it('preserves token and legacy token-detail routes', () => {
    const tokenAddress = '0x000000000000000000000000000000000000abcd'
    expect(renderParams('/explore/tokens/base', '/explore/:tab/:chainName')).toEqual({
      tab: ExploreTab.Tokens,
      chainName: 'base',
      tokenAddress: undefined,
    })
    expect(renderParams(`/tokens/base/${tokenAddress}`, '/tokens/:chainName/:tokenAddress')).toEqual({
      tab: ExploreTab.Tokens,
      chainName: 'base',
      tokenAddress,
    })
  })
})
