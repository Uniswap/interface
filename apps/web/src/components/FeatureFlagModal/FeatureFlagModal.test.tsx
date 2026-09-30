import userEvent from '@testing-library/user-event'
import { DynamicConfigs, Experiments, Layers, SwapLayerProperties } from '@universe/gating'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { beforeEach, describe, expect, it } from 'vitest'
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
    expect(screen.queryByText(Layers.Discovery)).not.toBeInTheDocument()
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
