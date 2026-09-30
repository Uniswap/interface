import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { useExploreNotFoundModal } from '~/pages/Explore/useExploreNotFoundModal'

function useHarness() {
  return { ...useExploreNotFoundModal(), navigate: useNavigate(), location: useLocation() }
}

function renderHarness(initialEntries: string[]) {
  const wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
      {children}
    </MemoryRouter>
  )
  return renderHook(useHarness, { wrapper })
}

describe('useExploreNotFoundModal', () => {
  it('opens the token modal from the TDP redirect params', () => {
    const { result } = renderHarness(['/explore?type=tokens&result=not-found'])
    expect(result.current.isTokenNotFoundOpen).toBe(true)
    expect(result.current.isPoolNotFoundOpen).toBe(false)
  })

  it('opens the pool modal from the PDP redirect params', () => {
    const { result } = renderHarness(['/explore/pools?type=pools&result=not-found'])
    expect(result.current.isPoolNotFoundOpen).toBe(true)
    expect(result.current.isTokenNotFoundOpen).toBe(false)
  })

  it('closing strips the params in place so browser back does not reopen it', () => {
    const { result } = renderHarness(['/explore', '/explore?type=tokens&result=not-found'])
    expect(result.current.isTokenNotFoundOpen).toBe(true)

    act(() => result.current.closeNotFoundModal())
    expect(result.current.isTokenNotFoundOpen).toBe(false)
    expect(result.current.location.search).toBe('')

    act(() => result.current.navigate(-1))
    expect(result.current.location.pathname).toBe('/explore')
    expect(result.current.isTokenNotFoundOpen).toBe(false)
  })

  it('dismisses on any other navigation, such as a tab switch', () => {
    const { result } = renderHarness(['/explore?type=tokens&result=not-found'])
    expect(result.current.isTokenNotFoundOpen).toBe(true)

    act(() => result.current.navigate('/explore/pools'))
    expect(result.current.isTokenNotFoundOpen).toBe(false)
    expect(result.current.isPoolNotFoundOpen).toBe(false)
  })
})
