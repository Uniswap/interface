import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { describe, expect, it, vi } from 'vitest'
import { NEW_TOKEN_PLACEHOLDER_ADDRESS } from '~/constants/tokenLaunch'
import { RaiseCurrency } from '~/features/Toucan/utils/raiseCurrency'
import { CustomizePoolStep } from '~/pages/Liquidity/CreateAuction/steps/CustomizePoolStep'
import { CreateAuctionStoreContext } from '~/pages/Liquidity/CreateAuction/store/CreateAuctionStoreContext'
import { createCreateAuctionStore } from '~/pages/Liquidity/CreateAuction/store/createCreateAuctionStore'
import { getPrimaryStablecoin } from '~/pages/Liquidity/CreateAuction/utils'
import { render } from '~/test-utils/render'

// The pool currencies the fee-tier gate checks for existing pools.
const captured = vi.hoisted(() => ({
  poolCurrencies: [] as (Currency | null | undefined)[],
}))

vi.mock('~/features/Liquidity/hooks/useAllFeeTierPoolData', () => ({
  useAllFeeTierPoolData: ({
    sdkCurrencies,
  }: {
    sdkCurrencies: { TOKEN0: Currency | null | undefined; TOKEN1: Currency | null | undefined }
  }) => {
    captured.poolCurrencies = [sdkCurrencies.TOKEN0, sdkCurrencies.TOKEN1]
    return { feeTierData: {}, isLoading: false }
  },
}))

/** The raise side of the checked pair: the half that isn't the not-yet-deployed auction token. */
function getRaiseSideOfCheckedPool(): Currency {
  const raiseSide = captured.poolCurrencies.find(
    (currency) => currency?.isNative || (currency?.isToken && currency.address !== NEW_TOKEN_PLACEHOLDER_ADDRESS),
  )
  if (!raiseSide) {
    throw new Error('the fee-tier gate was not given a raise currency')
  }
  return raiseSide
}

/** Stores a STABLECOIN selection, then launches on `chainId`, as a chain switch after the commit does. */
function renderCustomizePoolStepWithStoredStablecoinSelection(chainId: UniverseChainId): void {
  const store = createCreateAuctionStore()
  const { actions } = store.getState()
  actions.setRaiseCurrency(RaiseCurrency.STABLECOIN)
  actions.commitTokenFormAndAdvance()
  actions.updateCreateNewTokenField('network', chainId)

  render(
    <CreateAuctionStoreContext.Provider value={store}>
      <CustomizePoolStep />
    </CreateAuctionStoreContext.Provider>,
  )
}

describe('CustomizePoolStep fee-tier gate', () => {
  it('checks the native pool on a chain whose raise options are the same token', () => {
    renderCustomizePoolStepWithStoredStablecoinSelection(UniverseChainId.Arc)

    // The launch is created against the native slot there, so the gate must check that pool and
    // not the stablecoin ERC-20 pair, which is a different v4 pool key.
    expect(getRaiseSideOfCheckedPool().isNative).toBe(true)
  })

  it('checks the stablecoin pool on a chain whose raise options differ', () => {
    renderCustomizePoolStepWithStoredStablecoinSelection(UniverseChainId.Mainnet)

    const raiseSide = getRaiseSideOfCheckedPool()
    expect(raiseSide.isNative).toBe(false)
    expect(raiseSide.wrapped.address).toBe(getPrimaryStablecoin(UniverseChainId.Mainnet).address)
  })
})
