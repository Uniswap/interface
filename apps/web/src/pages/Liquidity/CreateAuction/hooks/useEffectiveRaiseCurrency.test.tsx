import { UniverseChainId } from '@universe/chains'
import { describe, expect, it } from 'vitest'
import { RaiseCurrency } from '~/features/Toucan/utils/raiseCurrency'
import { useEffectiveRaiseCurrency } from '~/pages/Liquidity/CreateAuction/hooks/useEffectiveRaiseCurrency'
import { CreateAuctionStoreContext } from '~/pages/Liquidity/CreateAuction/store/CreateAuctionStoreContext'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { DEFAULT_EXISTING_TOKEN_FORM } from '~/pages/Liquidity/CreateAuction/types'
import { render, screen } from '~/test-utils/render'

const EFFECTIVE_TEST_ID = 'effective-raise-currency'

function EffectiveRaiseCurrencyProbe(): JSX.Element {
  return <span data-testid={EFFECTIVE_TEST_ID}>{useEffectiveRaiseCurrency()}</span>
}

function renderProbe(store: ReturnType<typeof createCreateAuctionStore>): void {
  render(
    <CreateAuctionStoreContext.Provider value={store}>
      <EffectiveRaiseCurrencyProbe />
    </CreateAuctionStoreContext.Provider>,
  )
}

function createStoreWithStablecoinSelection(): ReturnType<typeof createCreateAuctionStore> {
  const store = createCreateAuctionStore()
  store.getState().actions.setRaiseCurrency(RaiseCurrency.STABLECOIN)
  return store
}

describe('useEffectiveRaiseCurrency', () => {
  it('keeps the stored selection on a chain whose raise options differ', () => {
    const store = createStoreWithStablecoinSelection()
    store.getState().actions.updateCreateNewTokenField('network', UniverseChainId.Mainnet)

    renderProbe(store)

    expect(screen.getByTestId(EFFECTIVE_TEST_ID)).toHaveTextContent(RaiseCurrency.STABLECOIN)
  })

  it('resolves to native on a chain whose raise options are the same token', () => {
    const store = createStoreWithStablecoinSelection()
    store.getState().actions.updateCreateNewTokenField('network', UniverseChainId.Arc)

    renderProbe(store)

    expect(screen.getByTestId(EFFECTIVE_TEST_ID)).toHaveTextContent(RaiseCurrency.NATIVE)
  })

  it('keeps the stored selection while an existing token has not resolved', () => {
    const store = createStoreWithStablecoinSelection()
    store.getState().actions.setTokenForm(DEFAULT_EXISTING_TOKEN_FORM)

    renderProbe(store)

    // `useLaunchChainId` falls back to Mainnet there, a chain whose two raise options are different
    // tokens, so an unresolved token can't rewrite the selection.
    expect(screen.getByTestId(EFFECTIVE_TEST_ID)).toHaveTextContent(RaiseCurrency.STABLECOIN)
  })

  it('resolves against the token form network, not the chain the commit snapshot captured', () => {
    const store = createStoreWithStablecoinSelection()
    const { actions } = store.getState()
    actions.updateCreateNewTokenField('network', UniverseChainId.Mainnet)
    actions.commitTokenFormAndAdvance()
    // Reachable from the step indicator: the network changes without the commit running again.
    actions.updateCreateNewTokenField('network', UniverseChainId.Arc)

    renderProbe(store)

    expect(store.getState().configureAuction.committed?.totalSupply.currency.chainId).toBe(UniverseChainId.Mainnet)
    expect(screen.getByTestId(EFFECTIVE_TEST_ID)).toHaveTextContent(RaiseCurrency.NATIVE)
  })
})
