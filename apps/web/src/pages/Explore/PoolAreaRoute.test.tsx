import { Route, Routes } from 'react-router'
import { PoolAreaTab } from '~/features/Explore/poolArea/types'
import { PoolAreaRoute } from '~/pages/Explore/PoolAreaRoute'
import { render, screen, waitFor } from '~/test-utils/render'

const mountPage = vi.fn()

function Page(): JSX.Element {
  mountPage(window.location.pathname)
  return <div>Discovery page</div>
}

function renderRoute(path: string): void {
  window.history.replaceState(null, '', path)
  render(
    <Routes>
      <Route
        path="/explore/:tab/:chainName?"
        element={
          <PoolAreaRoute tab={PoolAreaTab.Hooks}>
            <Page />
          </PoolAreaRoute>
        }
      />
    </Routes>,
  )
}

describe('PoolAreaRoute', () => {
  beforeEach(() => {
    mountPage.mockClear()
  })

  it.each(['solana', 'invalid'])('normalizes %s before mounting discovery', async (chain) => {
    renderRoute(`/explore/hooks/${chain}?featureFlagOverride=hooks_explore_ux&hooksFixtureScenario=empty`)

    await waitFor(() => expect(window.location.pathname).toBe('/explore/hooks'))
    expect(mountPage.mock.calls.every(([pathname]) => pathname === '/explore/hooks')).toBe(true)
    expect(window.location.search).toBe('?featureFlagOverride=hooks_explore_ux&hooksFixtureScenario=empty')
    expect(await screen.findByText('Discovery page')).toBeInTheDocument()
  })

  it.each(['/explore/hooks', '/explore/hooks/base'])('retains the supported destination %s', (path) => {
    renderRoute(`${path}?featureFlagOverride=hooks_explore_ux`)

    expect(screen.getByText('Discovery page')).toBeInTheDocument()
    expect(window.location.pathname).toBe(path)
  })
})
