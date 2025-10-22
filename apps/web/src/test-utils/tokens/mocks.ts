// Import this file (test-utils/tokens/mock) at the top of a test file to use
// these predefined token lookup mocks.

vi.mock('hooks/Tokens')
vi.mock('components/AccountDrawer/MiniPortfolio/Activity/getCurrency')

import { Currency, WETH9 } from '@uniswap/sdk-core'
import { getCurrencyFromCurrencyId } from 'components/AccountDrawer/MiniPortfolio/Activity/getCurrency'
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
import { COMMON_BASES } from 'uniswap/src/constants/routing'
import { DAI, DAI_ARBITRUM_ONE, USDC_ARBITRUM, USDC_MAINNET, USDT, WBTC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

function isSameEthAddress(a?: string, b?: string): boolean {
  return areAddressesEqual({
    addressInput1: { address: a, platform: Platform.EVM },
    addressInput2: { address: b, platform: Platform.EVM },
  })
}

beforeEach(() => {
  // Global mocks for token lookups. To override in a test, use `mocked().mockImplementation(...)`.
  mocked(getCurrencyFromCurrencyId).mockImplementation(async (currencyId: string) => {
    const chainId = currencyIdToChain(currencyId)
    const address = currencyIdToAddress(currencyId)
    if (!chainId) {
      return undefined
    }

    if (chainId === UniverseChainId.Mainnet && isNativeCurrencyAddress(chainId, address)) {
      return NATIVE_INFO.currency
    }
    if (isSameEthAddress(address, DAI.address)) {
      return DAI_INFO.currency
    }
    if (isSameEthAddress(address, USDC_MAINNET.address)) {
      return USDC_INFO.currency
    }
    if (isSameEthAddress(address, WETH9[UniverseChainId.Mainnet].address)) {
      return WETH_INFO.currency
    }
    if (isSameEthAddress(address, USDT.address)) {
      return USDT_INFO.currency
    }
    if (isSameEthAddress(address, WBTC.address)) {
      return WBTC_INFO.currency
    }
    if (isSameEthAddress(address, DAI_ARBITRUM_ONE.address)) {
      return DAI_ARBITRUM_INFO.currency
    }
    if (isSameEthAddress(address, USDC_ARBITRUM.address)) {
      return USDC_ARBITRUM_INFO.currency
    }
    if (isSameEthAddress(address, TEST_TOKEN_1.address)) {
      return TEST_TOKEN_1_INFO.currency
    }
    if (isSameEthAddress(address, TEST_TOKEN_2.address)) {
      return TEST_TOKEN_2_INFO.currency
    }
    if (isSameEthAddress(address, TEST_TOKEN_3.address)) {
      return TEST_TOKEN_3_INFO.currency
    }
    return COMMON_BASES[chainId].find((base) =>
      base.currency.isNative ? base.currency.symbol === 'ETH' : base.currency.address === address,
    )?.currency
  })
  mocked(useCurrency).mockImplementation(({ address, chainId }: { address?: string; chainId?: UniverseChainId }) => {
    if (isNativeCurrencyAddress(UniverseChainId.Mainnet, address)) {
      return NATIVE_INFO.currency
    }
    if (isSameEthAddress(address, DAI.address)) {
      return DAI_INFO.currency
    }
    if (isSameEthAddress(address, USDC_MAINNET.address)) {
      return USDC_INFO.currency
    }
    if (isSameEthAddress(address, WETH9[UniverseChainId.Mainnet].address)) {
      return WETH_INFO.currency
    }
    if (isSameEthAddress(address, USDT.address)) {
      return USDT_INFO.currency
    }
    if (isSameEthAddress(address, WBTC.address)) {
      return WBTC_INFO.currency
    }
    if (isSameEthAddress(address, DAI_ARBITRUM_ONE.address)) {
      return DAI_ARBITRUM_INFO.currency
    }
    if (isSameEthAddress(address, USDC_ARBITRUM.address)) {
      return USDC_ARBITRUM_INFO.currency
    }
    if (isSameEthAddress(address, TEST_TOKEN_1.address)) {
      return TEST_TOKEN_1_INFO.currency
    }
    if (isSameEthAddress(address, TEST_TOKEN_2.address)) {
      return TEST_TOKEN_2_INFO.currency
    }
    if (isSameEthAddress(address, TEST_TOKEN_3.address)) {
      return TEST_TOKEN_3_INFO.currency
    }
    return COMMON_BASES[chainId ?? UniverseChainId.Mainnet].find((base) =>
      base.currency.isNative ? base.currency.symbol === 'ETH' : base.currency.address === address,
    )?.currency
  })
  mocked(useCurrencyInfo).mockImplementation((currency?: Currency | string) => {
    if (typeof currency !== 'string' && currency?.isNative) {
      return NATIVE_INFO
    }
    const address = typeof currency === 'string' ? currency : currency?.address
    if (isSameEthAddress(address, DAI.address)) {
      return DAI_INFO
    }
    if (isSameEthAddress(address, USDC_MAINNET.address)) {
      return USDC_INFO
    }
    if (isSameEthAddress(address, WETH9[UniverseChainId.Mainnet].address)) {
      return WETH_INFO
    }
    if (isSameEthAddress(address, USDT.address)) {
      return USDT_INFO
    }
    if (isSameEthAddress(address, WBTC.address)) {
      return WBTC_INFO
    }
    if (isSameEthAddress(address, DAI_ARBITRUM_ONE.address)) {
      return DAI_ARBITRUM_INFO
    }
    if (isSameEthAddress(address, USDC_ARBITRUM.address)) {
      return USDC_ARBITRUM_INFO
    }
    if (isSameEthAddress(address, TEST_TOKEN_1.address)) {
      return TEST_TOKEN_1_INFO
    }
    if (isSameEthAddress(address, TEST_TOKEN_2.address)) {
      return TEST_TOKEN_2_INFO
    }
    if (isSameEthAddress(address, TEST_TOKEN_3.address)) {
      return TEST_TOKEN_3_INFO
    }
    return undefined
  })
})
