import { fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DynamicConfigs, Experiments, getOverrideAdapter, Layers, SwapLayerProperties } from '@universe/gating'
import { useSearchParams } from 'react-router'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FeatureFlagModal } from '~/components/FeatureFlagModal/FeatureFlagModal'
import store from '~/state'
import { setOpenModal } from '~/state/application/reducer'
import { render, screen } from '~/test-utils/render'

// The modal only renders when its entry is the open modal in app state; dispatching the real
// action keeps the test on the production seam instead of mocking useModalState.
function renderOpenModal() {
  store.dispatch(setOpenModal({ name: ModalName.FeatureFlags }))
  return render(<FeatureFlagModal />)
}

function RouterSearchWriter() {
  const [, setSearchParams] = useSearchParams()
  const writeFilter = () =>
    setSearchParams((prev) => new URLSearchParams([...prev, ['filter', 'completed']]), { replace: true })
  return (
    <button type="button" onClick={writeFilter}>
      Write router param
    </button>
  )
}

function searchFor(term: string) {
  return userEvent.type(screen.getByPlaceholderText('Search flags...'), term)
}

describe('FeatureFlagModal search', () => {
  beforeEach(() => {
    store.dispatch(setOpenModal({ name: ModalName.FeatureFlags }))
  })

  it('filters gates by flag name', async () => {
    renderOpenModal()
    await searchFor('traceJsonRpc')

    expect(screen.getByText('traceJsonRpc')).toBeInTheDocument()
    expect(screen.queryByText('No flags found')).not.toBeInTheDocument()
  })

  it('returns the experiment whose name matches the search term', async () => {
    renderOpenModal()
    await searchFor(Experiments.EmbeddedWalletOnboarding)

    expect(screen.getByText(Experiments.EmbeddedWalletOnboarding)).toBeInTheDocument()
    expect(screen.queryByText('No flags found')).not.toBeInTheDocument()
  })

  it('returns the experiment when the search term matches only its param label', async () => {
    renderOpenModal()
    await searchFor('newFlowEnabled')

    expect(screen.getByText(Experiments.EmbeddedWalletOnboarding)).toBeInTheDocument()
  })

  it('returns the dynamic config whose name matches the search term', async () => {
    renderOpenModal()
    await searchFor(DynamicConfigs.NetworkRequests)

    expect(screen.getByText(DynamicConfigs.NetworkRequests)).toBeInTheDocument()
    expect(screen.queryByText('No flags found')).not.toBeInTheDocument()
  })

  it('returns the dynamic config when the search term matches only its config key', async () => {
    renderOpenModal()
    await searchFor('balanceMaxRefetchAttempts')

    expect(screen.getByText(DynamicConfigs.NetworkRequests)).toBeInTheDocument()
  })

  it('returns the layer whose param name matches the search term', async () => {
    renderOpenModal()
    await searchFor(SwapLayerProperties.EthAsErc20UniswapXEnabled)

    expect(screen.getByText(Layers.SwapPage)).toBeInTheDocument()
  })

  it('matches experiment and config names case-insensitively, like gates', async () => {
    renderOpenModal()
    await searchFor('NETWORK_REQUESTS')

    expect(screen.getByText(DynamicConfigs.NetworkRequests)).toBeInTheDocument()
  })

  it('does not show unrelated experiments or configs when a gate matches', async () => {
    renderOpenModal()
    await searchFor('traceJsonRpc')

    expect(screen.queryByText(Experiments.EmbeddedWalletOnboarding)).not.toBeInTheDocument()
    expect(screen.queryByText(DynamicConfigs.NetworkRequests)).not.toBeInTheDocument()
  })

  it('reports no results for a term that matches nothing', async () => {
    renderOpenModal()
    await searchFor('zzzznotathing')

    expect(screen.getByText('No flags found')).toBeInTheDocument()
  })
})

describe('FeatureFlagModal URL sync', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/swap?chain=base')
    vi.spyOn(getOverrideAdapter(), 'refreshStatsig').mockImplementation(() => undefined)
  })

  afterEach(() => {
    getOverrideAdapter().removeAllOverrides()
  })

  async function toggleGate(name: string) {
    const search = screen.getByPlaceholderText('Search flags...')
    await userEvent.clear(search)
    await userEvent.type(search, name)
    await userEvent.click(screen.getByRole('switch'))
  }

  it('adds the first toggled gate to a URL with no query string', async () => {
    window.history.replaceState(null, '', '/swap')
    renderOpenModal()
    await toggleGate('traceJsonRpc')

    expect(window.location.pathname).toBe('/swap')
    expect(window.location.search).toBe('?featureFlagOverride=traceJsonRpc')
  })

  it('lists several gates with literal commas', async () => {
    renderOpenModal()
    await toggleGate('traceJsonRpc')
    await toggleGate('no_uniswap_interface_fees')

    expect(window.location.search).toBe('?chain=base&featureFlagOverride=traceJsonRpc,no_uniswap_interface_fees')
  })

  it('adds a toggled gate to the URL and keeps unrelated params', async () => {
    renderOpenModal()
    await toggleGate('traceJsonRpc')

    const params = new URLSearchParams(window.location.search)
    expect(params.get('featureFlagOverride')).toBe('traceJsonRpc')
    expect(params.get('chain')).toBe('base')
  })

  it('keeps a gate turned off when a later router search write runs', async () => {
    window.history.replaceState(null, '', '/swap?featureFlagOverride=traceJsonRpc')
    render(
      <>
        <RouterSearchWriter />
        <FeatureFlagModal />
      </>,
    )
    store.dispatch(setOpenModal({ name: ModalName.FeatureFlags }))
    await toggleGate('traceJsonRpc')
    await userEvent.click(screen.getByRole('switch'))

    fireEvent.click(screen.getByRole('button', { name: 'Write router param', hidden: true }))

    const params = new URLSearchParams(window.location.search)
    expect(params.get('featureFlagOverrideOff')).toBe('traceJsonRpc')
    expect(params.has('featureFlagOverride')).toBe(false)
    expect(params.get('filter')).toBe('completed')
  })

  it('removes the gating params on Clear Overrides and keeps unrelated params', async () => {
    window.history.replaceState(null, '', '/swap?chain=base&experimentOverride=exp:test')
    renderOpenModal()
    await toggleGate('traceJsonRpc')

    await userEvent.click(screen.getByRole('button', { name: 'Clear Overrides' }))

    const params = new URLSearchParams(window.location.search)
    expect(params.has('featureFlagOverride')).toBe(false)
    expect(params.has('experimentOverride')).toBe(false)
    expect(params.get('chain')).toBe('base')
  })
})
