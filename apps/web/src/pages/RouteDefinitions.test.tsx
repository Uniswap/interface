import userEvent from '@testing-library/user-event'
import { FeatureFlags, useFeatureFlag, useStatsigClientStatus } from '@universe/gating'
import React from 'react'
import { Link } from 'react-router'
// oxlint-disable-next-line universe-custom/import-boundary -- route-wiring test renders the app shell on purpose
import { Body } from '~/app/layout/Body'
import { useRouterConfig } from '~/pages/RouteDefinitions'
import { render, renderHook, screen } from '~/test-utils/render'

const { loadHooksPage, mountHooksPage, loadPoolsPage, mountPoolsPage, loadHookDetails, mountHookDetails } = vi.hoisted(
  () => ({
    loadHooksPage: vi.fn(),
    mountHooksPage: vi.fn(),
    loadPoolsPage: vi.fn(),
    mountPoolsPage: vi.fn(),
    loadHookDetails: vi.fn(),
    mountHookDetails: vi.fn(),
  }),
)

vi.mock('~/pages/Swap', () => ({
  SwapPage: () => React.createElement(React.Fragment),
  Swap: () => React.createElement(React.Fragment),
}))

vi.mock('~/pages/Explore', () => ({
  default: () => React.createElement('div', null, 'Existing Explore'),
}))

vi.mock('~/pages/Explore/HooksPage', () => {
  loadHooksPage()
  return {
    default: () => {
      mountHooksPage()
      return React.createElement('div', null, 'Hooks preview')
    },
  }
})

vi.mock('~/pages/Explore/PoolsPage', () => {
  loadPoolsPage()
  return {
    default: function MockPoolsPage() {
      mountPoolsPage()

      return React.createElement(
        'div',
        null,
        'Pools discovery',
        React.createElement(
          Link,
          { to: '/explore/hooks/base/0x000000000000000000000000000000000000abcd' },
          'Open hook detail',
        ),
      )
    },
  }
})

vi.mock('~/pages/HookDetails', () => {
  loadHookDetails()
  return {
    default: function MockHookDetails() {
      mountHookDetails()

      return React.createElement(
        'div',
        null,
        'Hook detail',
        React.createElement(Link, { to: '/explore/pools/base' }, 'Back to Pools'),
      )
    },
  }
})

vi.mock('~/pages/NotFound', () => ({
  default: () => React.createElement('div', null, 'Existing Not Found'),
}))

const useFeatureFlagMock = vi.mocked(useFeatureFlag)

describe('Hooks Explore routing', () => {
  beforeEach(() => {
    loadHooksPage.mockClear()
    mountHooksPage.mockClear()
    loadPoolsPage.mockClear()
    mountPoolsPage.mockClear()
    loadHookDetails.mockClear()
    mountHookDetails.mockClear()
    window.history.replaceState(null, '', '/explore/hooks/ethereum')
    useFeatureFlagMock.mockImplementation((flag) => flag === FeatureFlags.HooksExplore)
  })

  it('updates the route when the feature gate changes', () => {
    useFeatureFlagMock.mockReturnValue(false)
    const { result, rerender } = renderHook(() => useRouterConfig())
    expect(result.current.isHooksExploreEnabled).toBe(false)

    useFeatureFlagMock.mockImplementation((flag) => flag === FeatureFlags.HooksExplore)
    rerender()
    expect(result.current.isHooksExploreEnabled).toBe(true)

    useFeatureFlagMock.mockReturnValue(false)
    rerender()
    expect(result.current.isHooksExploreEnabled).toBe(false)
  })

  it('does not load or mount Hooks for a disabled direct URL', async () => {
    useFeatureFlagMock.mockReturnValue(false)

    render(<Body shouldRenderAppChrome={false} />)

    expect(await screen.findByText('Existing Explore')).toBeInTheDocument()
    expect(loadHooksPage).not.toHaveBeenCalled()
    expect(mountHooksPage).not.toHaveBeenCalled()
  })

  it('mounts the lazy Hooks preview when the feature gate is enabled', async () => {
    render(<Body shouldRenderAppChrome={false} />)

    expect(await screen.findByText('Hooks preview')).toBeInTheDocument()
    expect(mountHooksPage).toHaveBeenCalled()
    expect(screen.queryByText('Existing Explore')).not.toBeInTheDocument()
  })

  it('keeps existing Pools composition when the flag is off', async () => {
    window.history.replaceState(null, '', '/explore/pools/base')
    useFeatureFlagMock.mockReturnValue(false)

    render(<Body shouldRenderAppChrome={false} />)

    expect(await screen.findByText('Existing Explore')).toBeInTheDocument()
    expect(loadPoolsPage).not.toHaveBeenCalled()
    expect(mountPoolsPage).not.toHaveBeenCalled()
  })

  it('mounts only the new Pools page when the feature gate is enabled', async () => {
    window.history.replaceState(null, '', '/explore/pools/base')

    render(<Body shouldRenderAppChrome={false} />)

    expect(await screen.findByText('Pools discovery')).toBeInTheDocument()
    expect(mountPoolsPage).toHaveBeenCalled()
    expect(mountHooksPage).not.toHaveBeenCalled()
    expect(screen.queryByText('Existing Explore')).not.toBeInTheDocument()
  })

  it('does not load or mount detail for a disabled direct URL', async () => {
    window.history.replaceState(null, '', '/explore/hooks/base/0x000000000000000000000000000000000000abcd')
    useFeatureFlagMock.mockReturnValue(false)

    render(<Body shouldRenderAppChrome={false} />)

    expect(await screen.findByText('Existing Not Found')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/not-found')
    expect(loadHookDetails).not.toHaveBeenCalled()
    expect(mountHookDetails).not.toHaveBeenCalled()
  })

  it('keeps a cold detail URL until Statsig loads', () => {
    const detailPath = '/explore/hooks/base/0x000000000000000000000000000000000000abcd'
    window.history.replaceState(null, '', detailPath)
    useFeatureFlagMock.mockReturnValue(false)
    vi.mocked(useStatsigClientStatus).mockReturnValue({
      isStatsigReady: false,
      isStatsigLoading: true,
      isStatsigUninitialized: false,
    })

    render(<Body shouldRenderAppChrome={false} />)

    expect(window.location.pathname).toBe(detailPath)
    expect(loadHookDetails).not.toHaveBeenCalled()
  })

  it('mounts the lazy detail page for an enabled direct URL', async () => {
    window.history.replaceState(null, '', '/explore/hooks/base/0x000000000000000000000000000000000000abcd')

    render(<Body shouldRenderAppChrome={false} />)

    expect(await screen.findByText('Hook detail')).toBeInTheDocument()
    expect(loadHookDetails).toHaveBeenCalled()
    expect(mountHookDetails).toHaveBeenCalled()
    expect(screen.queryByText('Existing Not Found')).not.toBeInTheDocument()
  })

  it('routes between the Pools page boundary and a hook detail and back', async () => {
    window.history.replaceState(null, '', '/explore/pools/base')
    render(<Body shouldRenderAppChrome={false} />)

    expect(await screen.findByText('Pools discovery')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Open hook detail' }))

    expect(await screen.findByText('Hook detail')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Back to Pools' }))

    expect(await screen.findByText('Pools discovery')).toBeInTheDocument()
  })
})
