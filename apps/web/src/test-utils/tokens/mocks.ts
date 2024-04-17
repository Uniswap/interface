// Import this file (test-utils/tokens/mock) at the top of a test file to use
// these predefined token lookup mocks.

jest.mock('hooks/Tokens')

import { ChainId, Currency, WETH9 } from '@uniswap/sdk-core'
import { COMMON_BASES } from 'constants/routing'
import { DAI, DAI_ARBITRUM_ONE, USDC_ARBITRUM, USDC_MAINNET, USDT, WBTC } from 'constants/tokens'
import { useCurrency, useCurrencyInfo } from 'hooks/Tokens'
import {
  DAI_ARBITRUM_INFO,
  DAI_INFO,
  NATIVE_INFO,
  TEST_TOKEN_1,
  TEST_TOKEN_1_INFO,
  TEST_TOKEN_2,
  TEST_TOKEN_2_INFO,
  TEST_TOKEN_3,
  TEST_TOKEN_3_INFO,
  USDC_ARBITRUM_INFO,
  USDC_INFO,
  USDT_INFO,
  WBTC_INFO,
  WETH_INFO,
} from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { isSameAddress } from 'utilities/src/addresses'

beforeEach(() => {
  // Global mocks for token lookups. To override in a test, use `mocked(useDefaultActiveTokens).mockImplementation(...)`.
  mocked(useCurrency).mockImplementation((address?: string, chainId?: ChainId) => {
    if (address?.toLowerCase() === DAI.address.toLowerCase()) {
      return DAI
    }
    if (address?.toLowerCase() === WETH9[ChainId.MAINNET].address.toLowerCase()) {
      return WETH9[ChainId.MAINNET]
    }
    if (address?.toLowerCase() === USDC_MAINNET.address.toLowerCase()) {
      return USDC_MAINNET
    }
    return COMMON_BASES[chainId ?? ChainId.MAINNET]?.find((base) =>
      base.isNative ? base.symbol === 'ETH' : base.address === address
    )
  })
  mocked(useCurrencyInfo).mockImplementation((currency?: Currency | string) => {
    if (typeof currency !== 'string' && currency?.isNative) return NATIVE_INFO
    const address = typeof currency === 'string' ? currency : currency?.address
    if (isSameAddress(address, DAI.address)) return DAI_INFO
    if (isSameAddress(address, USDC_MAINNET.address)) return USDC_INFO
    if (isSameAddress(address, WETH9[ChainId.MAINNET].address)) return WETH_INFO
    if (isSameAddress(address, USDT.address)) return USDT_INFO
    if (isSameAddress(address, WBTC.address)) return WBTC_INFO
    if (isSameAddress(address, DAI_ARBITRUM_ONE.address)) return DAI_ARBITRUM_INFO
    if (isSameAddress(address, USDC_ARBITRUM.address)) return USDC_ARBITRUM_INFO
    if (isSameAddress(address, TEST_TOKEN_1.address)) return TEST_TOKEN_1_INFO
    if (isSameAddress(address, TEST_TOKEN_2.address)) return TEST_TOKEN_2_INFO
    if (isSameAddress(address, TEST_TOKEN_3.address)) return TEST_TOKEN_3_INFO
    return undefined
  })
})
