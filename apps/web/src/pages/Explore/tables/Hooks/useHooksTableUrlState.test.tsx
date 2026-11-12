import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { type ReactNode, Suspense } from 'react'
import { BrowserRouter, HashRouter, useLocation, useNavigate } from 'react-router'
import { EMPTY_HOOK_FILTER_STATE } from '~/features/Hooks/hookFilters'
import { HookSortField } from '~/features/Hooks/types'
import { useHooksTableUrlState } from '~/pages/Explore/tables/Hooks/useHooksTableUrlState'

const routerMode = vi.hoisted(() => ({ hash: false }))

vi.mock('~/utils/env', () => ({ isBrowserRouterEnabled: () => !routerMode.hash }))

function Controls({ children }: { children?: ReactNode }): JSX.Element {
  const state = useHooksTableUrlState()
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <>
      <input
        aria-label="Search hooks"
        value={state.searchDraft}
        onChange={(event) => state.setSearch(event.target.value)}
      />
      <button onClick={() => state.setSearch('')}>Clear</button>
      <button onClick={() => state.setSort(HookSortField.Tvl)}>TVL</button>
      <button
        onClick={() =>
          state.setFilters({ ...EMPTY_HOOK_FILTER_STATE, tvlBucketId: 'gt-10m', routedOnly: true, metadataOnly: true })
        }
      >
        Apply filters
      </button>
      <button onClick={() => state.setFilters(EMPTY_HOOK_FILTER_STATE)}>Clear filters</button>
      <button onClick={() => navigate({ pathname: '/explore/hooks/base', search: location.search })}>Base</button>
      <output data-testid="committed">{JSON.stringify([state.search, state.sortField, state.sortDirection])}</output>
      <output data-testid="filters">{JSON.stringify(state.filters)}</output>
      {children}
    </>
  )
}

function typeSearch(value: string): void {
  fireEvent.change(screen.getByRole('textbox', { name: 'Search hooks' }), { target: { value } })
}

async function advance(milliseconds = 300): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds)
  })
}

function params(): URLSearchParams {
  return new URLSearchParams(routerMode.hash ? window.location.hash.split('?')[1] : window.location.search)
}

describe('Hooks URL controls', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    routerMode.hash = false
    window.history.replaceState(null, '', '/explore/hooks?featureFlagOverride=hooks_explore_ux&lng=en-US')
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('debounces only input events, preserves case and unrelated params, and clears immediately', async () => {
    render(
      <BrowserRouter>
        <Controls />
      </BrowserRouter>,
    )
    typeSearch('Ang')
    await advance(200)
    typeSearch('Angstrom')
    await advance(299)
    expect(params().has('hookSearch')).toBe(false)
    await advance(1)
    expect(params().get('hookSearch')).toBe('Angstrom')
    expect(screen.getByTestId('committed')).toHaveTextContent('["Angstrom","volume","desc"]')
    expect(params().get('featureFlagOverride')).toBe('hooks_explore_ux')
    expect(params().get('lng')).toBe('en-US')

    typeSearch('pending')
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(params().has('hookSearch')).toBe(false)
    await advance()
    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(params().has('hookSearch')).toBe(false)
  })

  it('restores two settled searches and sort through Back and Forward', async () => {
    render(
      <BrowserRouter>
        <Controls />
      </BrowserRouter>,
    )
    typeSearch('Angstrom')
    await advance()
    typeSearch('Stable')
    await advance()
    fireEvent.click(screen.getByRole('button', { name: 'TVL' }))
    expect(params().get('hookSort')).toBe('tvl')

    window.history.back()
    await advance(10)
    expect(screen.getByRole('textbox')).toHaveValue('Stable')
    expect(screen.getByTestId('committed')).toHaveTextContent('["Stable","volume","desc"]')
    window.history.back()
    await advance(10)
    expect(screen.getByRole('textbox')).toHaveValue('Angstrom')
    window.history.forward()
    await advance(10)
    expect(screen.getByRole('textbox')).toHaveValue('Stable')
    await advance()
    expect(params().get('hookSearch')).toBe('Stable')
  })

  it('preserves a trailing space across the debounce pause when typing continues', async () => {
    render(
      <BrowserRouter>
        <Controls />
      </BrowserRouter>,
    )
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Search hooks' })
    typeSearch('uni ')
    await advance()
    expect(params().get('hookSearch')).toBe('uni')
    expect(input).toHaveValue('uni ')
    expect(screen.getByTestId('committed')).toHaveTextContent('["uni","volume","desc"]')

    typeSearch(`${input.value}swap`)
    await advance()
    expect(params().get('hookSearch')).toBe('uni swap')
    expect(input).toHaveValue('uni swap')

    window.history.back()
    await advance(10)
    expect(params().get('hookSearch')).toBe('uni')
    expect(input).toHaveValue('uni')
    await advance()
    expect(params().get('hookSearch')).toBe('uni')
  })

  it('restores the canonical search draft on Back even when only the URL sort changes', async () => {
    window.history.replaceState(null, '', '/explore/hooks?hookSearch=uni')
    render(
      <BrowserRouter>
        <Controls />
      </BrowserRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'TVL' }))
    typeSearch('uni ')
    await advance()
    expect(screen.getByRole('textbox')).toHaveValue('uni ')
    expect(params().get('hookSort')).toBe('tvl')

    window.history.back()
    await advance(10)
    expect(screen.getByRole('textbox')).toHaveValue('uni')
    expect(screen.getByTestId('committed')).toHaveTextContent('["uni","volume","desc"]')
    await advance()
    expect(params().has('hookSort')).toBe(false)
    expect(params().get('hookSearch')).toBe('uni')
  })

  it('flushes the latest trimmed draft with sort in one history entry and cancels its timer', async () => {
    render(
      <BrowserRouter>
        <Controls />
      </BrowserRouter>,
    )
    const push = vi.spyOn(window.history, 'pushState')
    act(() => {
      typeSearch('  AnGstrom  ')
      fireEvent.click(screen.getByRole('button', { name: 'TVL' }))
    })
    expect(params().get('hookSearch')).toBe('AnGstrom')
    expect(params().get('hookSort')).toBe('tvl')
    expect(params().get('featureFlagOverride')).toBe('hooks_explore_ux')
    expect(params().get('lng')).toBe('en-US')
    expect(screen.getByRole('textbox')).toHaveValue('AnGstrom')
    expect(screen.getByTestId('committed')).toHaveTextContent('["AnGstrom","tvl","desc"]')
    expect(push).toHaveBeenCalledTimes(1)
    await advance()
    expect(push).toHaveBeenCalledTimes(1)

    window.history.back()
    await advance(10)
    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(screen.getByTestId('committed')).toHaveTextContent('["","volume","desc"]')
    window.history.forward()
    await advance(10)
    expect(screen.getByRole('textbox')).toHaveValue('AnGstrom')
    expect(screen.getByTestId('committed')).toHaveTextContent('["AnGstrom","tvl","desc"]')
  })

  it('clears a whitespace-only draft while committing the new sort', async () => {
    window.history.replaceState(null, '', '/explore/hooks?hookSearch=Stable&lng=en-US')
    render(
      <BrowserRouter>
        <Controls />
      </BrowserRouter>,
    )
    typeSearch('   ')
    fireEvent.click(screen.getByRole('button', { name: 'TVL' }))
    expect(params().has('hookSearch')).toBe(false)
    expect(params().get('hookSort')).toBe('tvl')
    expect(screen.getByRole('textbox')).toHaveValue('')
    await advance()
    expect(params().has('hookSearch')).toBe(false)
  })

  it('flushes pending search and applied filters in one history entry while preserving the current network and sort', async () => {
    window.history.replaceState(
      null,
      '',
      '/explore/hooks/base?hookSort=tvl&hookSortDirection=asc&lng=en-US&featureFlagOverride=hooks_explore_ux',
    )
    render(
      <BrowserRouter>
        <Controls />
      </BrowserRouter>,
    )
    const push = vi.spyOn(window.history, 'pushState')
    act(() => {
      typeSearch('  AnGstrom  ')
      fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
    })

    expect(push).toHaveBeenCalledTimes(1)
    expect(window.location.pathname).toBe('/explore/hooks/base')
    expect(params().get('hookSearch')).toBe('AnGstrom')
    expect(params().get('hookSort')).toBe('tvl')
    expect(params().get('hookSortDirection')).toBe('asc')
    expect(params().get('hookTvl')).toBe('gt-10m')
    expect(params().get('hookRouted')).toBe('true')
    expect(params().get('hookMetadata')).toBe('true')
    expect(params().get('lng')).toBe('en-US')
    expect(params().get('featureFlagOverride')).toBe('hooks_explore_ux')
    await advance()
    expect(push).toHaveBeenCalledTimes(1)

    window.history.back()
    await advance(10)
    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(screen.getByTestId('filters')).toHaveTextContent(JSON.stringify(EMPTY_HOOK_FILTER_STATE))
    expect(params().has('hookTvl')).toBe(false)
    window.history.forward()
    await advance(10)
    expect(screen.getByRole('textbox')).toHaveValue('AnGstrom')
    expect(params().get('hookRouted')).toBe('true')
    expect(screen.getByTestId('filters')).toHaveTextContent('"metadataOnly":true')
  })

  it('clears only advanced filters and flushes typing without resetting search, network or sorting', async () => {
    window.history.replaceState(
      null,
      '',
      '/explore/hooks/base?hookSearch=old&hookSort=tvl&hookSortDirection=asc&hookTvl=100k-1m&hookRouted=true&hookVerifiedSource=true&hookMetadata=true',
    )
    render(
      <BrowserRouter>
        <Controls />
      </BrowserRouter>,
    )
    const push = vi.spyOn(window.history, 'pushState')
    typeSearch('new')
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(push).toHaveBeenCalledTimes(1)
    expect(window.location.pathname).toBe('/explore/hooks/base')
    expect([...params()]).toEqual([
      ['hookSearch', 'new'],
      ['hookSort', 'tvl'],
      ['hookSortDirection', 'asc'],
    ])
    expect(screen.getByTestId('filters')).toHaveTextContent(JSON.stringify(EMPTY_HOOK_FILTER_STATE))
    await advance()
    expect(push).toHaveBeenCalledTimes(1)

    window.history.back()
    await advance(10)
    expect(screen.getByRole('textbox')).toHaveValue('old')
    expect(params().get('hookVerifiedSource')).toBe('true')
    typeSearch('must not return')
    window.history.forward()
    await advance(10)
    await advance()
    expect(screen.getByRole('textbox')).toHaveValue('new')
    expect(params().has('hookMetadata')).toBe(false)
    expect(params().get('hookSearch')).toBe('new')
  })

  it('cancels a draft when Back happens before the debounce expires', async () => {
    render(
      <BrowserRouter>
        <Controls />
      </BrowserRouter>,
    )
    typeSearch('Angstrom')
    await advance()
    typeSearch('Stable')
    await advance()
    typeSearch('must not return')
    window.history.back()
    await advance(10)
    expect(screen.getByRole('textbox')).toHaveValue('Angstrom')
    await advance()
    expect(params().get('hookSearch')).toBe('Angstrom')
    expect(screen.getByTestId('committed')).toHaveTextContent('["Angstrom","volume","desc"]')
  })

  it('cancels on synchronous history transitions even when they finish at the same URL', async () => {
    render(
      <BrowserRouter>
        <Controls />
      </BrowserRouter>,
    )
    const original = window.location.href
    typeSearch('must not return')
    act(() => {
      window.history.replaceState({ key: 'other' }, '', '/explore/hooks?hookSearch=other')
      window.dispatchEvent(new PopStateEvent('popstate'))
      window.history.replaceState({ key: 'default' }, '', original)
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await advance()
    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(window.location.href).toBe(original)
  })

  it('cancels stale typing on network changes and on unmount', async () => {
    const view = render(
      <BrowserRouter>
        <Controls />
      </BrowserRouter>,
    )
    typeSearch('pending')
    fireEvent.click(screen.getByRole('button', { name: 'Base' }))
    await advance()
    expect(window.location.pathname).toBe('/explore/hooks/base')
    expect(params().has('hookSearch')).toBe(false)
    expect(screen.getByRole('textbox')).toHaveValue('')
    typeSearch('unmounted')
    view.unmount()
    await advance()
    expect(params().has('hookSearch')).toBe(false)
  })

  it('preserves typing that starts after its own navigation but before that transition commits', async () => {
    let release: () => void = () => {}
    let blocked = true
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    function SlowResult(): JSX.Element | null {
      const { search } = useLocation()
      if (blocked && new URLSearchParams(search).get('hookSearch') === 'Ang') {
        throw gate
      }
      return null
    }
    render(
      <BrowserRouter>
        <Suspense fallback="Loading">
          <Controls>
            <SlowResult />
          </Controls>
        </Suspense>
      </BrowserRouter>,
    )
    typeSearch('Ang')
    await advance()
    expect(params().get('hookSearch')).toBe('Ang')
    typeSearch('Angstrom')
    await act(async () => {
      blocked = false
      release()
    })
    expect(screen.getByRole('textbox')).toHaveValue('Angstrom')
    await advance()
    expect(params().get('hookSearch')).toBe('Angstrom')
    expect(screen.getByTestId('committed')).toHaveTextContent('["Angstrom","volume","desc"]')
  })

  it('does not flush an older draft when sorting during an uncommitted network navigation', async () => {
    let release: () => void = () => {}
    let blocked = true
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    function SlowNetworkResult(): JSX.Element | null {
      const { pathname } = useLocation()
      if (blocked && pathname === '/explore/hooks/base') {
        throw gate
      }
      return null
    }
    render(
      <BrowserRouter>
        <Suspense fallback="Loading">
          <Controls>
            <SlowNetworkResult />
          </Controls>
        </Suspense>
      </BrowserRouter>,
    )
    typeSearch('must not return')
    fireEvent.click(screen.getByRole('button', { name: 'Base' }))
    expect(window.location.pathname).toBe('/explore/hooks/base')
    fireEvent.click(screen.getByRole('button', { name: 'TVL' }))
    expect(params().get('hookSort')).toBe('tvl')
    expect(params().has('hookSearch')).toBe(false)
    await act(async () => {
      blocked = false
      release()
    })
    await advance()
    expect(window.location.pathname).toBe('/explore/hooks/base')
    expect(params().has('hookSearch')).toBe(false)
    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(screen.getByTestId('committed')).toHaveTextContent('["","tvl","desc"]')
  })

  it('applies filters to the latest network without reviving a draft from the previous route', async () => {
    let release: () => void = () => {}
    let blocked = true
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    function SlowNetworkResult(): JSX.Element | null {
      const { pathname } = useLocation()
      if (blocked && pathname === '/explore/hooks/base') {
        throw gate
      }
      return null
    }
    render(
      <BrowserRouter>
        <Suspense fallback="Loading">
          <Controls>
            <SlowNetworkResult />
          </Controls>
        </Suspense>
      </BrowserRouter>,
    )
    typeSearch('must not return')
    fireEvent.click(screen.getByRole('button', { name: 'Base' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
    expect(window.location.pathname).toBe('/explore/hooks/base')
    expect(params().has('hookSearch')).toBe(false)
    expect(params().get('hookRouted')).toBe('true')
    await act(async () => {
      blocked = false
      release()
    })
    await advance()
    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(params().has('hookSearch')).toBe(false)
    expect(params().get('hookMetadata')).toBe('true')
  })

  it('keeps typing begun during a filter navigation and retains those filters when the search settles', async () => {
    let release: () => void = () => {}
    let blocked = true
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    function SlowFilterResult(): JSX.Element | null {
      const { search } = useLocation()
      if (blocked && new URLSearchParams(search).get('hookRouted') === 'true') {
        throw gate
      }
      return null
    }
    render(
      <BrowserRouter>
        <Suspense fallback="Loading">
          <Controls>
            <SlowFilterResult />
          </Controls>
        </Suspense>
      </BrowserRouter>,
    )
    typeSearch('Ang')
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
    expect(params().get('hookSearch')).toBe('Ang')
    typeSearch('Angstrom')
    await act(async () => {
      blocked = false
      release()
    })
    expect(screen.getByRole('textbox')).toHaveValue('Angstrom')
    await advance()
    expect(params().get('hookSearch')).toBe('Angstrom')
    expect(params().get('hookTvl')).toBe('gt-10m')
    expect(params().get('hookRouted')).toBe('true')
  })

  it('writes search and sort inside hash routes while retaining outer hosting parameters', async () => {
    routerMode.hash = true
    window.history.replaceState(null, '', '/ipfs/?hosting=keep#/explore/hooks/base?lng=en-US')
    render(
      <HashRouter>
        <Controls />
      </HashRouter>,
    )
    typeSearch('Angstrom')
    await advance()
    fireEvent.click(screen.getByRole('button', { name: 'TVL' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
    expect(window.location.pathname).toBe('/ipfs/')
    expect(window.location.search).toBe('?hosting=keep')
    expect(window.location.hash).toContain('#/explore/hooks/base?')
    expect(params().get('hookSearch')).toBe('Angstrom')
    expect(params().get('hookSort')).toBe('tvl')
    expect(params().get('hookRouted')).toBe('true')
    expect(params().get('hookTvl')).toBe('gt-10m')
    expect(params().get('lng')).toBe('en-US')
  })
})
