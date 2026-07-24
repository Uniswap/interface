import { render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, Route, Routes, useNavigate, useSearchParams } from 'react-router'
import { ResetPortfolioChainOnEntryEffect } from '~/app/bootstrap/ResetPortfolioChainOnEntry'
import { CHAIN_SEARCH_PARAM } from '~/utils/params/chainQueryParam'

function SearchSnapshot(): JSX.Element {
  const [params] = useSearchParams()
  return <div data-testid="search-snapshot">{params.toString()}</div>
}

/**
 * Uses useEffect (not useLayoutEffect) so MemoryRouter applies pathname + search in one update.
 * useLayoutEffect + navigate matches in-browser less well in tests and can commit ?chain= before other keys.
 */
function NavigateOnMount({ to }: { to: string }): null {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(to)
  }, [navigate, to])
  return null
}

function harness(initialPath: string, exploreNavigateTo?: string): void {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ResetPortfolioChainOnEntryEffect />
      <SearchSnapshot />
      <Routes>
        <Route path="/explore" element={exploreNavigateTo ? <NavigateOnMount to={exploreNavigateTo} /> : null} />
        <Route path="/portfolio" element={null} />
        <Route path="/portfolio/tokens" element={null} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResetPortfolioChainOnEntryEffect', () => {
  it('does not remove chain on first paint when landing directly on portfolio with ?chain=', async () => {
    harness('/portfolio?chain=ethereum')

    await waitFor(() => {
      expect(screen.getByTestId('search-snapshot').textContent).toContain(`${CHAIN_SEARCH_PARAM}=ethereum`)
    })
  })

  it('removes chain when navigating onto portfolio from a non-portfolio URL', async () => {
    harness('/explore', '/portfolio?chain=ethereum')

    await waitFor(() => {
      expect(screen.getByTestId('search-snapshot').textContent).toBe('')
    })
  })

  it('removes only chain and preserves other query params', async () => {
    harness('/explore', '/portfolio?chain=base&foo=bar')

    await waitFor(() => {
      // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
      const q = screen.getByTestId('search-snapshot').textContent ?? ''
      expect(q).not.toContain(CHAIN_SEARCH_PARAM)
      expect(q).toContain('foo=bar')
    })
  })

  it('does not remove chain when moving between portfolio routes', async () => {
    render(
      <MemoryRouter initialEntries={['/portfolio?chain=arbitrum']}>
        <ResetPortfolioChainOnEntryEffect />
        <SearchSnapshot />
        <Routes>
          <Route path="/portfolio" element={<NavigateOnMount to="/portfolio/tokens?chain=arbitrum" />} />
          <Route path="/portfolio/tokens" element={null} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('search-snapshot').textContent).toContain(`${CHAIN_SEARCH_PARAM}=arbitrum`)
    })
  })
})
