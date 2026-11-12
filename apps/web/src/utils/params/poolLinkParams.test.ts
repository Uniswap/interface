import { Ether, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { buildCreatePoolHrefFromCurrencies, CREATE_POOL_PATH } from '~/utils/params/poolLinkParams'

const USDC_MAINNET = new Token(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
const WETH_MAINNET = new Token(UniverseChainId.Mainnet, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH')
const USDC_BASE = new Token(UniverseChainId.Base, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC')
const ETH_BASE = Ether.onChain(UniverseChainId.Base)

describe('buildCreatePoolHrefFromCurrencies', () => {
  it('carries both tokens and the chain they resolved on', () => {
    expect(buildCreatePoolHrefFromCurrencies({ currencyA: USDC_MAINNET, currencyB: WETH_MAINNET })).toBe(
      `${CREATE_POOL_PATH}?currencyA=${USDC_MAINNET.address}&currencyB=${WETH_MAINNET.address}&chain=ethereum`,
    )
  })

  // The chain comes off the currency, so a pair picked on an L2 can never be seeded on mainnet —
  // this is the case that regressed when the chain was read from the `filterChain` param instead.
  it('takes the chain from the currency, not from any filter state', () => {
    expect(buildCreatePoolHrefFromCurrencies({ currencyA: ETH_BASE, currencyB: USDC_BASE })).toBe(
      `${CREATE_POOL_PATH}?currencyA=${NATIVE_CHAIN_ID}&currencyB=${USDC_BASE.address}&chain=base`,
    )
  })

  it('carries a single resolved token, on either side, with its chain', () => {
    expect(buildCreatePoolHrefFromCurrencies({ currencyA: USDC_BASE })).toBe(
      `${CREATE_POOL_PATH}?currencyA=${USDC_BASE.address}&chain=base`,
    )
    expect(buildCreatePoolHrefFromCurrencies({ currencyB: USDC_BASE })).toBe(
      `${CREATE_POOL_PATH}?currencyB=${USDC_BASE.address}&chain=base`,
    )
  })

  // An address with no chain is the harmful output: the create page resolves it against its own
  // default. Leaving the token out degrades to the blank form instead.
  it('never emits an address without a chain', () => {
    for (const href of [
      buildCreatePoolHrefFromCurrencies({}),
      buildCreatePoolHrefFromCurrencies({ currencyA: undefined, currencyB: null }),
      buildCreatePoolHrefFromCurrencies({ currencyA: USDC_MAINNET }),
      buildCreatePoolHrefFromCurrencies({ currencyA: ETH_BASE, currencyB: USDC_BASE }),
    ]) {
      const search = new URLSearchParams(href.split('?')[1] ?? '')
      const hasToken = search.has('currencyA') || search.has('currencyB')
      expect(hasToken).toBe(search.has('chain'))
    }
  })

  it('returns the bare path when nothing resolved', () => {
    expect(buildCreatePoolHrefFromCurrencies({})).toBe(CREATE_POOL_PATH)
    expect(buildCreatePoolHrefFromCurrencies({ currencyA: null, currencyB: undefined })).toBe(CREATE_POOL_PATH)
  })

  // The hook resolves both sides with one chain hint, so it cannot hand this function a
  // cross-chain pair — but a caller that resolved the two sides independently could, and seeding
  // one would ask the create page for a pool that cannot exist.
  it('drops a token on a different chain from the anchor', () => {
    expect(buildCreatePoolHrefFromCurrencies({ currencyA: USDC_MAINNET, currencyB: USDC_BASE })).toBe(
      `${CREATE_POOL_PATH}?currencyA=${USDC_MAINNET.address}&chain=ethereum`,
    )
  })
})
