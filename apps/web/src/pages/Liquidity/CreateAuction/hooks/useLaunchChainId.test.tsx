import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { describe, expect, it } from 'vitest'
import { areRaiseCurrencyOptionsSameToken } from '~/features/Toucan/utils/raiseCurrency'
import { useLaunchChainId } from '~/pages/Liquidity/CreateAuction/hooks/useLaunchChainId'
import { CreateAuctionStoreContext } from '~/pages/Liquidity/CreateAuction/store/CreateAuctionStoreContext'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { DEFAULT_EXISTING_TOKEN_FORM } from '~/pages/Liquidity/CreateAuction/types'
import { render, screen } from '~/test-utils/render'

const LAUNCH_CHAIN_TEST_ID = 'launch-chain-id'

/** An existing token on a chain that is neither the new-token default network nor the fallback. */
const EXISTING_TOKEN = new Token(
  UniverseChainId.Base,
  '0x4200000000000000000000000000000000000042',
  18,
  'TKN',
  'Existing Token',
)

function LaunchChainIdProbe(): JSX.Element {
  return <span data-testid={LAUNCH_CHAIN_TEST_ID}>{String(useLaunchChainId())}</span>
}

function renderProbe(store: ReturnType<typeof createCreateAuctionStore>): void {
  render(
    <CreateAuctionStoreContext.Provider value={store}>
      <LaunchChainIdProbe />
    </CreateAuctionStoreContext.Provider>,
  )
}

/** The rendered chain id, compared whole: a substring match would let Mainnet (1) pass for 130. */
function renderedLaunchChainId(): string | null {
  return screen.getByTestId(LAUNCH_CHAIN_TEST_ID).textContent
}

describe('useLaunchChainId', () => {
  it('returns the network the new-token form is on', () => {
    const store = createCreateAuctionStore()
    store.getState().actions.updateCreateNewTokenField('network', UniverseChainId.Unichain)

    renderProbe(store)

    expect(renderedLaunchChainId()).toBe(String(UniverseChainId.Unichain))
  })

  it("returns a resolved existing token's own chain", () => {
    const store = createCreateAuctionStore()
    store.getState().actions.setTokenForm({
      ...DEFAULT_EXISTING_TOKEN_FORM,
      existingTokenCurrencyInfo: buildCurrencyInfo({
        currency: EXISTING_TOKEN,
        currencyId: currencyId(EXISTING_TOKEN),
        logoUrl: null,
        isSpam: false,
      }),
    })

    renderProbe(store)

    expect(renderedLaunchChainId()).toBe(String(UniverseChainId.Base))
  })

  it('falls back to Mainnet, not another chain, while an existing token has not resolved', () => {
    const store = createCreateAuctionStore()
    store.getState().actions.setTokenForm(DEFAULT_EXISTING_TOKEN_FORM)

    renderProbe(store)

    expect(renderedLaunchChainId()).toBe(String(UniverseChainId.Mainnet))
    // The fallback has to be a chain whose two raise options are different tokens, or resolution
    // would rewrite a stablecoin selection to native before the real chain is known.
    expect(areRaiseCurrencyOptionsSameToken(UniverseChainId.Mainnet)).toBe(false)
  })
})
