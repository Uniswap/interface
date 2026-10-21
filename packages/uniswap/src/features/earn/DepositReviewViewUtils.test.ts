import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { getDepositQuoteRequestBase } from 'uniswap/src/features/earn/DepositReviewViewUtils'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { describe, expect, it } from 'vitest'

const VAULT_ADDRESS = '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0'
const USDC_ARBITRUM = new Token(UniverseChainId.ArbitrumOne, '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 6, 'USDC')

const vault = {
  vaultAddress: VAULT_ADDRESS,
  chainId: UniverseChainId.Mainnet,
} as EarnVaultInfo

const baseParams = {
  accountAddress: '0xabc',
  currency: USDC_ARBITRUM,
  inputCurrencyAmount: CurrencyAmount.fromRawAmount(USDC_ARBITRUM, '1000000'),
  quoteSourceTradingApiChainId: TradingApi.ChainId._42161,
  vault,
  vaultTradingApiChainId: TradingApi.ChainId._1,
}

describe('getDepositQuoteRequestBase — gas params', () => {
  it('sends urgency and no gasStrategies', () => {
    const result = getDepositQuoteRequestBase(baseParams)
    expect(result?.gasStrategies).toBeUndefined()
    expect(result?.urgency).toBe('urgent')
  })

  it('keeps the base request shape', () => {
    const result = getDepositQuoteRequestBase(baseParams)
    expect(result).toEqual(
      expect.objectContaining({
        type: TradingApi.TradeType.EXACT_INPUT,
        amount: '1000000',
        tokenIn: USDC_ARBITRUM.address,
        tokenOut: VAULT_ADDRESS,
        tokenInChainId: TradingApi.ChainId._42161,
        tokenOutChainId: TradingApi.ChainId._1,
        swapper: '0xabc',
        recipient: '0xabc',
        routingPreference: TradingApi.RoutingPreference.BEST_PRICE,
      }),
    )
  })

  it('sends autoSlippage DEFAULT and no slippageTolerance', () => {
    const result = getDepositQuoteRequestBase(baseParams)
    expect(result?.autoSlippage).toBe(TradingApi.AutoSlippage.DEFAULT)
    expect(result?.slippageTolerance).toBeUndefined()
  })

  it('returns undefined when a required field is missing', () => {
    expect(getDepositQuoteRequestBase({ ...baseParams, accountAddress: undefined })).toBeUndefined()
  })
})
