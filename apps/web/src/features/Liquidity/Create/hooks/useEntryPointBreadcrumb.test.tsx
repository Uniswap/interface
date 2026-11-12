import { renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { BrowserRouter } from 'react-router'
import { useEntryPointBreadcrumb } from '~/features/Liquidity/Create/hooks/useEntryPointBreadcrumb'

function wrapper({ children }: PropsWithChildren): JSX.Element {
  return <BrowserRouter>{children}</BrowserRouter>
}

describe('useEntryPointBreadcrumb', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/positions/add/new')
  })

  it('should default to the positions breadcrumb when no entry point is present', () => {
    const { result } = renderHook(() => useEntryPointBreadcrumb(), { wrapper })

    expect(result.current).toEqual({
      label: 'Your positions',
      to: '/positions',
      hasEntryPoint: false,
    })
  })

  it('returns to the originating hook detail page', () => {
    const entryPoint = '/explore/hooks/base/0x1111111111111111111111111111111111111111?network=all'
    window.history.pushState({}, '', `/positions/add/new?${new URLSearchParams({ entryPoint })}`)

    const { result } = renderHook(() => useEntryPointBreadcrumb(), { wrapper })

    expect(result.current).toEqual({ label: 'Hook details', to: entryPoint, hasEntryPoint: true })
  })

  it('should use the Portfolio breadcrumb for a Portfolio Pools entry point query param', () => {
    const entryPoint = '/portfolio/pools?chain=base'
    window.history.pushState({}, '', `/positions/add/new?${new URLSearchParams({ entryPoint }).toString()}`)

    const { result } = renderHook(() => useEntryPointBreadcrumb(), { wrapper })

    expect(result.current).toEqual({
      label: 'Portfolio',
      to: entryPoint,
      hasEntryPoint: true,
    })
  })

  it('should use the Portfolio breadcrumb for an external wallet Portfolio Pools entry point', () => {
    const entryPoint = '/portfolio/0x1234567890123456789012345678901234567890/pools'
    window.history.pushState({}, '', `/positions/add/new?${new URLSearchParams({ entryPoint }).toString()}`)

    const { result } = renderHook(() => useEntryPointBreadcrumb(), { wrapper })

    expect(result.current).toEqual({
      label: 'Portfolio',
      to: entryPoint,
      hasEntryPoint: true,
    })
  })

  it('should use location state as a fallback when no query entry point exists', () => {
    window.history.pushState({ usr: { entryPoint: '/portfolio/pools' } }, '', '/positions/add/new')

    const { result } = renderHook(() => useEntryPointBreadcrumb(), { wrapper })

    expect(result.current).toEqual({
      label: 'Portfolio',
      to: '/portfolio/pools',
      hasEntryPoint: true,
    })
  })

  it('should ignore protocol-relative entry points', () => {
    window.history.pushState(
      {},
      '',
      `/positions/add/new?${new URLSearchParams({ entryPoint: '//evil.com/portfolio/pools' }).toString()}`,
    )

    const { result } = renderHook(() => useEntryPointBreadcrumb(), { wrapper })

    expect(result.current).toEqual({
      label: 'Your positions',
      to: '/positions',
      hasEntryPoint: false,
    })
  })

  it('should ignore malformed explore pool detail entry points', () => {
    window.history.pushState(
      {},
      '',
      `/positions/add/new?${new URLSearchParams({ entryPoint: '/explore/pools/../../foo' }).toString()}`,
    )

    const { result } = renderHook(() => useEntryPointBreadcrumb(), { wrapper })

    expect(result.current).toEqual({
      label: 'Your positions',
      to: '/positions',
      hasEntryPoint: false,
    })
  })

  it('should ignore malformed Portfolio Pools entry points', () => {
    window.history.pushState(
      {},
      '',
      `/positions/add/new?${new URLSearchParams({ entryPoint: '/portfolio/../pools' }).toString()}`,
    )

    const { result } = renderHook(() => useEntryPointBreadcrumb(), { wrapper })

    expect(result.current).toEqual({
      label: 'Your positions',
      to: '/positions',
      hasEntryPoint: false,
    })
  })

  it('should ignore Portfolio Pools entry points with invalid address segments', () => {
    window.history.pushState(
      {},
      '',
      `/positions/add/new?${new URLSearchParams({ entryPoint: '/portfolio/not-an-address/pools' }).toString()}`,
    )

    const { result } = renderHook(() => useEntryPointBreadcrumb(), { wrapper })

    expect(result.current).toEqual({
      label: 'Your positions',
      to: '/positions',
      hasEntryPoint: false,
    })
  })
})
