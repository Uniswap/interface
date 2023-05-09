import { SupportedChainId as MockSupportedChainId } from 'constants/chains'
import {
  DAI as MockDAI,
  USDC_MAINNET as MockUSDC_MAINNET,
  USDC_OPTIMISM as MockUSDC_OPTIMISM,
  USDT as MockUSDT,
  WETH_POLYGON as MockWETH_POLYGON,
} from 'constants/tokens'
import { renderHook } from 'test-utils/render'

import { useAllTokensMultichain } from './Tokens'

jest.mock('../state/lists/hooks.ts', () => {
  return {
    useCombinedTokenMapFromUrls: () => ({
      [MockSupportedChainId.MAINNET]: {
        [MockDAI.address]: { token: MockDAI },
        [MockUSDC_MAINNET.address]: { token: MockUSDC_MAINNET },
      },
      [MockSupportedChainId.POLYGON]: {
        [MockWETH_POLYGON.address]: { token: MockWETH_POLYGON },
      },
    }),
  }
})

jest.mock('../state/hooks.ts', () => {
  return {
    useAppSelector: () => ({
      [MockSupportedChainId.MAINNET]: {
        [MockDAI.address]: MockDAI,
        [MockUSDT.address]: MockUSDT,
      },
      [MockSupportedChainId.OPTIMISM]: {
        [MockUSDC_OPTIMISM.address]: MockUSDC_OPTIMISM,
      },
    }),
  }
})

describe('useAllTokensMultichain', () => {
  it('should return multi-chain tokens from lists and userAddedTokens', () => {
    const { result } = renderHook(() => useAllTokensMultichain())

    expect(result.current).toStrictEqual({
      [MockSupportedChainId.MAINNET]: {
        [MockDAI.address]: MockDAI,
        [MockUSDC_MAINNET.address]: MockUSDC_MAINNET,
        [MockUSDT.address]: MockUSDT,
      },
      [MockSupportedChainId.POLYGON]: {
        [MockWETH_POLYGON.address]: MockWETH_POLYGON,
      },
      [MockSupportedChainId.OPTIMISM]: {
        [MockUSDC_OPTIMISM.address]: MockUSDC_OPTIMISM,
      },
    })
  })
})
