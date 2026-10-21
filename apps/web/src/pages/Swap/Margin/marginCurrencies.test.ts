import { CurrencyAmount } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  type MarginPlanStep,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { describe, expect, it } from 'vitest'
import { MARGIN_CHAIN_ID, type MarginMarket } from '~/constants/margin'
import {
  getSpendablePaymentBalance,
  isMarketDefaultPaymentToken,
  isPaymentTokenDifferentFromCollateral,
  marginStepTokenInCurrencyId,
  marginTokenCurrencyId,
} from '~/pages/Swap/Margin/marginCurrencies'

// Verified via chain reads (QuickNode Chain Prism, mainnet + Base): 0xcbB7...33Bf resolves to
// symbol() 'cbBTC' / decimals() 8 on BOTH chains — Coinbase's cbBTC vanity address is identical across
// chains, so an address-only comparison can't tell a mainnet cbBTC payment from a Base one (NEW-FE-3).
const CBBTC_ADDRESS = '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf'

const cbBtcMarket: MarginMarket = {
  key: 'cbbtc-usdc-MORPHO',
  asset: 'BTC',
  name: 'Coinbase Wrapped BTC',
  displaySymbol: 'cbBTC',
  collateral: { address: CBBTC_ADDRESS, symbol: 'cbBTC', decimals: 8 },
  debt: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
  venue: 'MORPHO',
  lltvWad: '860000000000000000',
  shouldUseNativeEquity: false,
}

const mainnetCbBtcToken: MarginPaymentToken = {
  address: CBBTC_ADDRESS,
  symbol: 'cbBTC',
  decimals: 8,
  isNative: false,
  chainId: MARGIN_CHAIN_ID,
}

// Same address, wrong chain — the Base pick that today gets silently swallowed as "market default".
const baseCbBtcToken: MarginPaymentToken = { ...mainnetCbBtcToken, chainId: UniverseChainId.Base }

describe('isMarketDefaultPaymentToken', () => {
  it('is the market default when the address and chain both match the collateral', () => {
    expect(isMarketDefaultPaymentToken({ token: mainnetCbBtcToken, market: cbBtcMarket })).toBe(true)
  })

  // NEW-FE-3 repro: same vanity address as the mainnet default, but on Base — must NOT resolve as
  // default, or the selection collapses to undefined on save and the L2 pick becomes unreachable.
  it('is not the market default when the address matches but the chain is an L2', () => {
    expect(isMarketDefaultPaymentToken({ token: baseCbBtcToken, market: cbBtcMarket })).toBe(false)
  })
})

describe('isPaymentTokenDifferentFromCollateral', () => {
  it('does not differ from collateral when the address and chain both match', () => {
    expect(isPaymentTokenDifferentFromCollateral({ token: mainnetCbBtcToken, market: cbBtcMarket })).toBe(false)
  })

  // Any off-margin-chain token always needs the bridge path, even when its address matches the
  // collateral's — the whole point of the fix.
  it('always differs from collateral when the token is on an L2', () => {
    expect(isPaymentTokenDifferentFromCollateral({ token: baseCbBtcToken, market: cbBtcMarket })).toBe(true)
  })

  it('native ETH differs from collateral unless the market uses native equity', () => {
    const nativeToken: MarginPaymentToken = {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      decimals: 18,
      isNative: true,
      chainId: MARGIN_CHAIN_ID,
    }
    expect(isPaymentTokenDifferentFromCollateral({ token: nativeToken, market: cbBtcMarket })).toBe(true)
    expect(
      isPaymentTokenDifferentFromCollateral({
        token: nativeToken,
        market: { ...cbBtcMarket, shouldUseNativeEquity: true },
      }),
    ).toBe(false)
  })
})

describe('getSpendablePaymentBalance', () => {
  const nativeToken: MarginPaymentToken = {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    chainId: UniverseChainId.Base,
  }

  // FE-UI-STATE-13: a native L2 payment's own gas comes out of the same balance being spent, so the
  // reserve must apply regardless of chain, not just on the margin chain.
  it('reserves gas for a native payment token on an L2 source chain', () => {
    const balance = CurrencyAmount.fromRawAmount(nativeOnChain(UniverseChainId.Base), '1000000000000000000')
    const spendable = getSpendablePaymentBalance({ paymentToken: nativeToken, balance })
    expect(spendable?.lessThan(balance)).toBe(true)
    expect(spendable?.greaterThan(0)).toBe(true)
  })

  it('passes an ERC-20 balance through unchanged regardless of chain', () => {
    const erc20Token: MarginPaymentToken = { ...nativeToken, isNative: false, address: CBBTC_ADDRESS, decimals: 8 }
    const balance = CurrencyAmount.fromRawAmount(nativeOnChain(UniverseChainId.Base), '1000000000000000000')
    expect(getSpendablePaymentBalance({ paymentToken: erc20Token, balance })).toBe(balance)
  })

  it('passes an undefined balance through unchanged', () => {
    expect(getSpendablePaymentBalance({ paymentToken: nativeToken, balance: undefined })).toBeUndefined()
  })
})

function makeSourceStep(overrides?: Partial<Pick<MarginPlanStep, 'tokenIn' | 'tokenInChainId'>>): MarginPlanStep {
  return {
    stepIndex: 0,
    stepType: 'MARGIN_PRE_SWAP',
    method: 'SEND_TX',
    payloadType: 'TX',
    payload: {},
    status: 'AWAITING_ACTION',
    ...overrides,
  }
}

describe('marginStepTokenInCurrencyId', () => {
  const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

  it('returns undefined when the step has no tokenIn', () => {
    expect(marginStepTokenInCurrencyId(makeSourceStep())).toBeUndefined()
  })

  it('builds a chain-aware currencyId for a source-chain ERC20', () => {
    expect(
      marginStepTokenInCurrencyId(makeSourceStep({ tokenIn: UNI_ADDRESS, tokenInChainId: UniverseChainId.Unichain })),
    ).toBe(buildCurrencyId(UniverseChainId.Unichain, UNI_ADDRESS))
  })

  it('maps a native (0x0) tokenIn to the source chain native currency', () => {
    expect(
      marginStepTokenInCurrencyId(
        makeSourceStep({ tokenIn: MARGIN_NATIVE_TOKEN_ADDRESS, tokenInChainId: UniverseChainId.Unichain }),
      ),
    ).toBe(buildNativeCurrencyId(UniverseChainId.Unichain))
  })

  it('returns undefined (never throws) for a non-Universe wire chainId — the render-crash guard', () => {
    expect(
      marginStepTokenInCurrencyId(makeSourceStep({ tokenIn: MARGIN_NATIVE_TOKEN_ADDRESS, tokenInChainId: 999999999 })),
    ).toBeUndefined()
  })
})

describe('marginTokenCurrencyId', () => {
  const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

  it('routes wrapped-native (WETH) to the native currencyId so its logo resolves as ETH', () => {
    expect(marginTokenCurrencyId({ address: WETH_ADDRESS, symbol: 'WETH', decimals: 18 })).toBe(
      buildNativeCurrencyId(MARGIN_CHAIN_ID),
    )
  })

  it('builds an address currencyId for a non-native token', () => {
    expect(marginTokenCurrencyId({ address: USDC_ADDRESS, symbol: 'USDC', decimals: 6 })).toBe(
      buildCurrencyId(MARGIN_CHAIN_ID, USDC_ADDRESS),
    )
  })
})
