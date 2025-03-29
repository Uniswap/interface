// Import this file (test-utils/tokens/mock) at the top of a test file to use
// these predefined token lookup mocks.

jest.mock('hooks/Tokens')
jest.mock('components/AccountDrawer/MiniPortfolio/Activity/getCurrency')

import { Currency, WETH9 } from '@uniswap/sdk-core'
import { getCurrency } from 'components/AccountDrawer/MiniPortfolio/Activity/getCurrency'
import { useCurrency, useCurrencyInfo } from 'hooks/Tokens'
import {
  NATIVE_INFO,
  TEST_TOKEN_1,
  TEST_TOKEN_1_INFO,
  TEST_TOKEN_2,
  TEST_TOKEN_2_INFO,
  TEST_TOKEN_3,
  TEST_TOKEN_3_INFO,
  WETH_INFO,
} from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { COMMON_BASES } from 'uniswap/src/constants/routing'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isSameAddress } from 'utilities/src/addresses'

beforeEach(() => {
  // Global mocks for token lookups. To override in a test, use `mocked().mockImplementation(...)`.
  mocked(getCurrency).mockImplementation(async (currencyId: string, chainId: UniverseChainId) => {
    if (currencyId?.toLowerCase() === 'eth') {
      return NATIVE_INFO?.currency
    }

    if (isSameAddress(currencyId, WETH9[UniverseChainId.Mainnet].address)) {
      return WETH_INFO?.currency
    }

    if (isSameAddress(currencyId, TEST_TOKEN_1.address)) {
      return TEST_TOKEN_1_INFO?.currency
    }
    if (isSameAddress(currencyId, TEST_TOKEN_2.address)) {
      return TEST_TOKEN_2_INFO?.currency
    }
    if (isSameAddress(currencyId, TEST_TOKEN_3.address)) {
      return TEST_TOKEN_3_INFO?.currency
    }
    return COMMON_BASES[chainId ?? UniverseChainId.Mainnet]?.find((base) =>
      base.currency.isNative ? base.currency.symbol === 'ETH' : base.currency.address === currencyId,
    )?.currency
  })
  mocked(useCurrency).mockImplementation((address?: string, chainId?: UniverseChainId) => {
    if (address?.toLowerCase() === 'eth') {
      return NATIVE_INFO?.currency
    }
    if (isSameAddress(address, WETH9[UniverseChainId.Mainnet].address)) {
      return WETH_INFO?.currency
    }
    if (isSameAddress(address, TEST_TOKEN_1.address)) {
      return TEST_TOKEN_1_INFO?.currency
    }
    if (isSameAddress(address, TEST_TOKEN_2.address)) {
      return TEST_TOKEN_2_INFO?.currency
    }
    if (isSameAddress(address, TEST_TOKEN_3.address)) {
      return TEST_TOKEN_3_INFO?.currency
    }
    return COMMON_BASES[chainId ?? UniverseChainId.Mainnet]?.find((base) =>
      base.currency.isNative ? base.currency.symbol === 'ETH' : base.currency.address === address,
    )?.currency
  })
  mocked(useCurrencyInfo).mockImplementation((currency?: Currency | string) => {
    if (typeof currency !== 'string' && currency?.isNative) {
      return NATIVE_INFO
    }
    const address = typeof currency === 'string' ? currency : currency?.address

    if (isSameAddress(address, WETH9[UniverseChainId.Mainnet].address)) {
      return WETH_INFO
    }

    if (isSameAddress(address, TEST_TOKEN_1.address)) {
      return TEST_TOKEN_1_INFO
    }
    if (isSameAddress(address, TEST_TOKEN_2.address)) {
      return TEST_TOKEN_2_INFO
    }
    if (isSameAddress(address, TEST_TOKEN_3.address)) {
      return TEST_TOKEN_3_INFO
    }
    return undefined
  })
})
