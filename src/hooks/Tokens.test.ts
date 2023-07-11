import { ChainId as MockChainId } from '@thinkincoin-libs/sdk-core'
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
      [MockChainId.MAINNET]: {
        [MockDAI.address]: { token: MockDAI },
        [MockUSDC_MAINNET.address]: { token: MockUSDC_MAINNET },
      },
      [MockChainId.POLYGON]: {
        [MockWETH_POLYGON.address]: { token: MockWETH_POLYGON },
      },
    }),
  }
})

jest.mock('../state/hooks.ts', () => {
  return {
    useAppSelector: () => ({
      [MockChainId.MAINNET]: {
        [MockDAI.address]: MockDAI,
        [MockUSDT.address]: MockUSDT,
      },
      [MockChainId.OPTIMISM]: {
        [MockUSDC_OPTIMISM.address]: MockUSDC_OPTIMISM,
      },
    }),
  }
})

describe('useAllTokensMultichain', () => {
  it('should return multi-chain tokens from lists and userAddedTokens', () => {
    const { result } = renderHook(() => useAllTokensMultichain())

    expect(result.current).toStrictEqual({
      [MockChainId.MAINNET]: {
        [MockDAI.address]: MockDAI,
        [MockUSDC_MAINNET.address]: MockUSDC_MAINNET,
        [MockUSDT.address]: MockUSDT,
      },
      [MockChainId.POLYGON]: {
        [MockWETH_POLYGON.address]: MockWETH_POLYGON,
      },
      [MockChainId.OPTIMISM]: {
        [MockUSDC_OPTIMISM.address]: MockUSDC_OPTIMISM,
      },
    })
  })
})
