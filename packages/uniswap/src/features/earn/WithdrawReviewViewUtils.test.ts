import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getWithdrawQuoteRequestBase } from 'uniswap/src/features/earn/WithdrawReviewViewUtils'
import { describe, expect, it } from 'vitest'

const VAULT_ADDRESS = '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0'
const USDC_ARBITRUM = new Token(UniverseChainId.ArbitrumOne, '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 6, 'USDC')

const vault = {
  vaultAddress: VAULT_ADDRESS,
  chainId: UniverseChainId.ArbitrumOne,
} as EarnVaultInfo

const baseParams = {
  accountAddress: '0xabc',
  currency: USDC_ARBITRUM,
  outputTradingApiChainId: TradingApi.ChainId._42161,
  vault,
  vaultTradingApiChainId: TradingApi.ChainId._42161,
  withdrawAmount: CurrencyAmount.fromRawAmount(USDC_ARBITRUM, '2000000'),
}

describe('getWithdrawQuoteRequestBase — gas params', () => {
  it('sends urgency and no gasStrategies', () => {
    const result = getWithdrawQuoteRequestBase(baseParams)
    expect(result?.gasStrategies).toBeUndefined()
    expect(result?.urgency).toBe('urgent')
  })

  it('keeps the base request shape', () => {
    const result = getWithdrawQuoteRequestBase(baseParams)
    expect(result).toEqual(
      expect.objectContaining({
        type: TradingApi.TradeType.EXACT_INPUT,
        amount: '2000000',
        tokenIn: VAULT_ADDRESS,
        tokenOut: USDC_ARBITRUM.address,
        tokenInChainId: TradingApi.ChainId._42161,
        tokenOutChainId: TradingApi.ChainId._42161,
        swapper: '0xabc',
        recipient: '0xabc',
        routingPreference: TradingApi.RoutingPreference.BEST_PRICE,
      }),
    )
  })

  it('sends autoSlippage DEFAULT and no slippageTolerance', () => {
    const result = getWithdrawQuoteRequestBase(baseParams)
    expect(result?.autoSlippage).toBe(TradingApi.AutoSlippage.DEFAULT)
    expect(result?.slippageTolerance).toBeUndefined()
  })

  it('returns undefined when a required field is missing', () => {
    expect(getWithdrawQuoteRequestBase({ ...baseParams, withdrawAmount: undefined })).toBeUndefined()
  })
})
