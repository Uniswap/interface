/* eslint-disable no-restricted-imports */
import { ConnectError } from '@connectrpc/connect'
import { UseQueryResult } from '@tanstack/react-query'
import { GetPositionsResponse } from '@uniswap/client-pools/dist/pools/v1/api_pb'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'

const TEST_POSITIONS_DATA = {
  positions: [
    {
      chainId: 1,
      protocolVersion: ProtocolVersion.V2,
      v2Pair: {
        token0: {
          chainId: 1,
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          decimals: 6,
        },
        token1: {
          chainId: 1,
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          symbol: 'WETH',
          decimals: 18,
        },
        liquidityToken: {
          chainId: 1,
          address: '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc',
          symbol: 'UNI-V2',
          decimals: 18,
        },
        reserve0: '45641156316559',
        reserve1: '17196237072419173119561',
      },
      status: PositionStatus.IN_RANGE,
    },
    {
      chainId: 1,
      protocolVersion: ProtocolVersion.V3,
      v3Position: {
        tokenId: '785499',
        tickLower: '197440',
        tickUpper: '198810',
        liquidity: '0',
        token0: {
          chainId: 1,
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          decimals: 6,
        },
        token1: {
          chainId: 1,
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          symbol: 'WETH',
          decimals: 18,
        },
        feeTier: '500',
        currentTick: '197497',
        currentPrice: '1539126286317107746121848509365654',
        tickSpacing: '10',
        token0UncollectedFees: '0',
        token1UncollectedFees: '0',
      },
      status: PositionStatus.OUT_OF_RANGE,
    },
    {
      chainId: 1,
      protocolVersion: ProtocolVersion.V4,
      v4Position: {
        poolPosition: {
          tokenId: '785426',
          tickLower: '197110',
          tickUpper: '197730',
          liquidity: '45985818120589024',
          token0: {
            chainId: 1,
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            symbol: 'USDC',
            decimals: 6,
          },
          token1: {
            chainId: 1,
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            symbol: 'WETH',
            decimals: 18,
          },
          feeTier: '500',
          currentTick: '197497',
          currentPrice: '1539126286317107746121848509365654',
          tickSpacing: '10',
          token0UncollectedFees: '0',
          token1UncollectedFees: '0',
        },
        hooks: [
          {
            address: '0x4c9AF439b1A6761B8E549D8d226A468a6b2803A8',
          },
        ],
      },
      status: PositionStatus.IN_RANGE,
    },
  ],
}

export function useGetPositionsQuery(): UseQueryResult<GetPositionsResponse, ConnectError> {
  /*input?: PartialMessage<GetPositionsRequest>,*/
  return {
    data: TEST_POSITIONS_DATA as unknown as GetPositionsResponse,
    isLoading: false,
    error: null,
  } as UseQueryResult<GetPositionsResponse, ConnectError>
  // return useQuery(getPositions, input, { transport: uniswapGetTransport })
}
