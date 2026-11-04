import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React from 'react'
import { Body } from '~/app/layout/Body'
import { useRouterConfig } from '~/pages/RouteDefinitions'
import { render, renderHook, screen } from '~/test-utils/render'

const { loadHooksPreview, mountHooksPreview } = vi.hoisted(() => ({
  loadHooksPreview: vi.fn(),
  mountHooksPreview: vi.fn(),
}))

vi.mock('~/pages/Swap', () => ({
  SwapPage: () => React.createElement(React.Fragment),
  Swap: () => React.createElement(React.Fragment),
}))

vi.mock('~/pages/Explore/redirects', () => ({
  default: () => React.createElement('div', null, 'Existing Explore'),
}))

vi.mock('~/pages/Explore/tables/Hooks/HooksPreview', () => {
  loadHooksPreview()
  return {
    default: () => {
      mountHooksPreview()
      return React.createElement('div', null, 'Hooks preview')
    },
  }
})

const useFeatureFlagMock = vi.mocked(useFeatureFlag)

describe('Hooks Explore routing', () => {
  beforeEach(() => {
    loadHooksPreview.mockClear()
    mountHooksPreview.mockClear()
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
    expect(loadHooksPreview).not.toHaveBeenCalled()
    expect(mountHooksPreview).not.toHaveBeenCalled()
  })

  it('mounts the lazy Hooks preview when the feature gate is enabled', async () => {
    render(<Body shouldRenderAppChrome={false} />)

    expect(await screen.findByText('Hooks preview')).toBeInTheDocument()
    expect(mountHooksPreview).toHaveBeenCalled()
    expect(screen.queryByText('Existing Explore')).not.toBeInTheDocument()
  })
})
