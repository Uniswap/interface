import { ChainId as MockChainId } from '@jaguarswap/sdk-core'
import {
  DAI as MockDAI,
  USDC as MockUSDC,
  USDC_OPTIMISM as MockUSDC_OPTIMISM,
  USDT as MockUSDT,
  WETH_POLYGON as MockWETH_POLYGON,
} from 'constants/tokens'
import { renderHook } from 'test-utils/render'

import { useAllTokensMultichain } from './Tokens'

jest.mock('../state/lists/hooks.ts', () => {
  return {
    useCombinedTokenMapFromUrls: () => ({
      [MockChainId.X1]: {
        [MockDAI.address]: { token: MockDAI },
        [MockUSDC.address]: { token: MockUSDC },
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
      [MockChainId.X1]: {
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
      [MockChainId.X1]: {
        [MockDAI.address]: MockDAI,
        [MockUSDC.address]: MockUSDC,
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
