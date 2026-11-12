import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { BrowserRouter, Route, Routes, useSearchParams } from 'react-router'
import { PositionsPoolAreaTabs } from '~/pages/Positions/components/PositionsPoolAreaTabs'

vi.mock('nuqs/adapters/react-router/v7', () => ({
  useOptimisticSearchParams: () => {
    const [searchParams] = useSearchParams()
    return searchParams
  },
}))

function PositionsNavigationHarness(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams()

  function updateParam(key: string, value: string): void {
    const params = new URLSearchParams(searchParams)
    params.set(key, value)
    setSearchParams(params)
  }

  return (
    <>
      <PositionsPoolAreaTabs />
      <button onClick={() => updateParam('chain', 'base')}>Select Base</button>
      <button onClick={() => updateParam('search', 'USDC')}>Search USDC</button>
    </>
  )
}

function renderNavigation(): void {
  render(
    <BrowserRouter>
      <Routes>
        <Route path="/positions" element={<PositionsNavigationHarness />} />
        <Route path="/explore/hooks/:chainName" element={<div>Hooks destination</div>} />
      </Routes>
    </BrowserRouter>,
  )
}

describe('PositionsPoolAreaTabs', () => {
  beforeEach(() => {
    vi.mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.HooksExplore)
    window.history.replaceState(null, '', '/positions?chain=ethereum&featureFlagOverride=hooks_explore_ux')
  })

  it('retains the current network and gating override through native link navigation', async () => {
    renderNavigation()
    const hooks = screen.getByRole('link', { name: 'Hooks' })
    expect(hooks).toHaveAttribute('href', '/explore/hooks/ethereum?featureFlagOverride=hooks_explore_ux')

    fireEvent.click(hooks)

    expect(await screen.findByText('Hooks destination')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/explore/hooks/ethereum')
    expect(new URLSearchParams(window.location.search).get('featureFlagOverride')).toBe('hooks_explore_ux')
  })

  it('carries current query updates into both discovery destinations', async () => {
    renderNavigation()
    fireEvent.click(screen.getByRole('button', { name: 'Select Base' }))
    fireEvent.click(screen.getByRole('button', { name: 'Search USDC' }))

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Hooks' })).toHaveAttribute(
        'href',
        '/explore/hooks/base?featureFlagOverride=hooks_explore_ux&search=USDC',
      ),
    )
    expect(screen.getByRole('link', { name: 'Pools' })).toHaveAttribute(
      'href',
      '/explore/pools/base?featureFlagOverride=hooks_explore_ux&search=USDC',
    )
    expect(new URLSearchParams(window.location.search).get('chain')).toBe('base')
    expect(new URLSearchParams(window.location.search).get('search')).toBe('USDC')
  })

  it('keeps the new navigation hidden while the feature is unavailable', () => {
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    renderNavigation()

    expect(screen.queryByRole('navigation', { name: 'Pools' })).not.toBeInTheDocument()
  })
})
