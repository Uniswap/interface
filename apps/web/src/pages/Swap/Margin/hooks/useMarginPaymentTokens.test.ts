import { USDC_MAINNET, nativeOnChain } from 'uniswap/src/constants/tokens'
import { MARGIN_NATIVE_TOKEN_ADDRESS } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { describe, expect, it } from 'vitest'
import { toMarginPaymentToken } from '~/pages/Swap/Margin/hooks/useMarginPaymentTokens'

const ETH = nativeOnChain(1)

describe('toMarginPaymentToken', () => {
  it('maps native ETH to the zero-address sentinel', () => {
    expect(toMarginPaymentToken(ETH)).toEqual({
      address: MARGIN_NATIVE_TOKEN_ADDRESS,
      symbol: 'ETH',
      decimals: 18,
      isNative: true,
      chainId: 1,
    })
  })

  it('keeps an ERC-20 address and chain', () => {
    expect(toMarginPaymentToken(USDC_MAINNET)).toMatchObject({
      address: USDC_MAINNET.address,
      decimals: 6,
      isNative: false,
      chainId: 1,
    })
  })
})
