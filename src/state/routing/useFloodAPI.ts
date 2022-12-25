import { AVERAGE_L1_BLOCK_TIME } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { useQuery } from 'react-query'

import { GetQuoteResult } from './types'

type FloodPathElement =
  | {
      address: string
      amountIn: string
      amountOut: string
      fee: string
      liquidity: string
      sqrtRatioX96: string
      tickCurrent: string
      tokenIn: string
      tokenOut: string
      type: 'v3-pool'
    }
  | {
      address: string
      amountIn: string
      amountOut: string
      fee: string
      tokenIn: string
      tokenOut: string
      reserve0: {
        quotient: string
        token: string
      }
      reserve1: {
        quotient: string
        token: string
      }
      type: 'v2-pool'
    }

type FloodPath = FloodPathElement[]
type FloodAPIResponse = {
  amount: string
  blockNumber: number
  quote: string
  route: FloodPath[]
}

export type FloodQuoteResult = Pick<GetQuoteResult, 'amount' | 'blockNumber' | 'quote' | 'route'>

type FloodChainConfig = {
  tokens: {
    [k: string]: {
      address: string
      decimals: number
      symbol: string
      chainId: number
    }
  }
  apiUrl: string
}
type SupportedFloodChainId = Extract<
  SupportedChainId,
  SupportedChainId.ARBITRUM_ONE | SupportedChainId.OPTIMISM | SupportedChainId.MAINNET | SupportedChainId.POLYGON
>
const SupportedFloodChainId = {
  MAINNET: SupportedChainId.MAINNET,
  OPTIMISM: SupportedChainId.OPTIMISM,
  ARBITRUM_ONE: SupportedChainId.ARBITRUM_ONE,
  POLYGON: SupportedChainId.POLYGON,
} as const

type FloodConfig = {
  [key in SupportedFloodChainId]: FloodChainConfig
}
const floodConfig: FloodConfig = {
  [SupportedFloodChainId.MAINNET]: {
    tokens: {
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6,
        symbol: 'USDC',
        chainId: 1,
      },
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        decimals: 18,
        symbol: 'WETH',
        chainId: 1,
      },
      '0x6b175474e89094c44da98b954eedeac495271d0f': {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        decimals: 18,
        symbol: 'DAI',
        chainId: 1,
      },
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': {
        address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        decimals: 8,
        symbol: 'WBTC',
        chainId: 1,
      },
      '0xdac17f958d2ee523a2206206994597c13d831ec7': {
        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        decimals: 6,
        symbol: 'USDT',
        chainId: 1,
      },
      '0x853d955acef822db058eb8505911ed77f175b99e': {
        address: '0x853d955acef822db058eb8505911ed77f175b99e',
        decimals: 18,
        symbol: 'FRAX',
        chainId: 1,
      },
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        decimals: 18,
        symbol: 'UNI',
        chainId: 1,
      },
      '0x4fabb145d64652a948d72533023f6e7a623c7c53': {
        address: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
        decimals: 18,
        symbol: 'BUSD',
        chainId: 1,
      },
    },
    apiUrl: 'http://localhost:8080',
  },
  [SupportedFloodChainId.OPTIMISM]: {
    tokens: {
      '0x7f5c764cbc14f9669b88837ca1490cca17c31607': {
        address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
        decimals: 6,
        symbol: 'USDC',
        chainId: 10,
      },
      '0x4200000000000000000000000000000000000006': {
        address: '0x4200000000000000000000000000000000000006',
        decimals: 18,
        symbol: 'WETH',
        chainId: 10,
      },
      '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': {
        address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
        decimals: 18,
        symbol: 'DAI',
        chainId: 10,
      },
      '0x68f180fcce6836688e9084f035309e29bf0a2095': {
        address: '0x68f180fcce6836688e9084f035309e29bf0a2095',
        decimals: 8,
        symbol: 'WBTC',
        chainId: 10,
      },
      '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58': {
        address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
        decimals: 6,
        symbol: 'USDT',
        chainId: 10,
      },
      '0x2e3d870790dc77a83dd1d18184acc7439a53f475': {
        address: '0x2e3d870790dc77a83dd1d18184acc7439a53f475',
        decimals: 18,
        symbol: 'FRAX',
        chainId: 10,
      },
      '0x4200000000000000000000000000000000000042': {
        address: '0x4200000000000000000000000000000000000042',
        decimals: 18,
        symbol: 'OP',
        chainId: 10,
      },
      '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': {
        address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
        decimals: 18,
        symbol: 'LYRA',
        chainId: 10,
      },
      '0x3c8b650257cfb5f272f799f5e2b4e65093a11a05': {
        address: '0x3c8b650257cfb5f272f799f5e2b4e65093a11a05',
        decimals: 18,
        symbol: 'VELO',
        chainId: 10,
      },
    },
    apiUrl: 'http://localhost:8080',
  },
  [SupportedFloodChainId.POLYGON]: {
    tokens: {
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': {
        address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        decimals: 6,
        symbol: 'USDC',
        chainId: 137,
      },
      '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': {
        address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
        decimals: 18,
        symbol: 'WETH',
        chainId: 137,
      },
      '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': {
        address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
        decimals: 18,
        symbol: 'DAI',
        chainId: 137,
      },
      '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': {
        address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
        decimals: 8,
        symbol: 'WBTC',
        chainId: 137,
      },
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': {
        address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        decimals: 6,
        symbol: 'USDT',
        chainId: 137,
      },
      '0x45c32fa6df82ead1e2ef74d17b76547eddfaff89': {
        address: '0x45c32fa6df82ead1e2ef74d17b76547eddfaff89',
        decimals: 18,
        symbol: 'FRAX',
        chainId: 137,
      },
      '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': {
        address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        decimals: 18,
        symbol: 'WMATIC',
        chainId: 137,
      },
    },
    apiUrl: 'http://localhost:8080',
  },
  [SupportedFloodChainId.ARBITRUM_ONE]: {
    tokens: {
      '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': {
        address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
        decimals: 6,
        symbol: 'USDC',
        chainId: 42161,
      },
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': {
        address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        decimals: 18,
        symbol: 'WETH',
        chainId: 42161,
      },
      '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': {
        address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
        decimals: 18,
        symbol: 'DAI',
        chainId: 42161,
      },
      '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f': {
        address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
        decimals: 8,
        symbol: 'WBTC',
        chainId: 42161,
      },
      '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': {
        address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        decimals: 6,
        symbol: 'USDT',
        chainId: 42161,
      },
      '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a': {
        address: '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a',
        decimals: 18,
        symbol: 'GMX',
        chainId: 42161,
      },
      '0xf97f4df75117a78c1a5a0dbb814af92458539fb4': {
        address: '0xf97f4df75117a78c1a5a0dbb814af92458539fb4',
        decimals: 18,
        symbol: 'LINK',
        chainId: 42161,
      },
    },
    apiUrl: 'http://localhost:8080',
  },
}

function isChainIdSupported(chainId?: number): chainId is SupportedFloodChainId {
  if (!chainId) {
    return false
  }
  return Object.values(SupportedFloodChainId).includes(chainId as SupportedFloodChainId)
}

function isTokenSupported(token?: string, chainId?: SupportedFloodChainId): boolean {
  if (!token || !chainId) {
    return false
  }
  return Boolean(floodConfig[chainId].tokens[token.toLowerCase()])
}

function tokenFromAddress(address: string, chainId: SupportedFloodChainId) {
  return floodConfig[chainId].tokens[address.toLowerCase()]
}

function augmentResponse(response: FloodAPIResponse, chainId: SupportedFloodChainId): FloodQuoteResult {
  const newRoute = response.route.map((path) =>
    path.map((element) => {
      if (element.type === 'v2-pool') {
        return {
          ...element,
          tokenIn: tokenFromAddress(element.tokenIn, chainId),
          tokenOut: tokenFromAddress(element.tokenOut, chainId),
          reserve0: {
            ...element.reserve0,
            token: tokenFromAddress(element.reserve0.token, chainId),
          },
          reserve1: {
            ...element.reserve1,
            token: tokenFromAddress(element.reserve1.token, chainId),
          },
        }
      }

      return {
        ...element,
        tokenIn: tokenFromAddress(element.tokenIn, chainId),
        tokenOut: tokenFromAddress(element.tokenOut, chainId),
      }
    })
  )

  return {
    ...response,
    blockNumber: response.blockNumber.toString(),
    route: newRoute,
  }
}

async function getFloodAPIQuote(tokenIn: string, tokenOut: string, amountIn: string, chainId: SupportedFloodChainId) {
  const apiUrl = floodConfig[chainId].apiUrl

  const url = `${apiUrl}/quote`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      amountIn,
      tokenIn,
      chainId,
      tokenOut,
    }),
  })
  if (response.status !== 200) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  const resp = (await response.json()) as FloodAPIResponse

  return augmentResponse(resp, chainId)
}

export function useFloodAPI(
  tokenIn?: string,
  tokenOut?: string,
  amountIn?: string,
  chainId?: number,
  enabledExt = true
) {
  const enabled =
    enabledExt &&
    Boolean(amountIn) &&
    isChainIdSupported(chainId) &&
    isTokenSupported(tokenIn, chainId) &&
    isTokenSupported(tokenOut, chainId)
  const result = useQuery<FloodQuoteResult>(
    ['flood', tokenIn, tokenOut, amountIn, chainId],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () => getFloodAPIQuote(tokenIn!, tokenOut!, amountIn!, chainId!),
    { enabled, refetchInterval: AVERAGE_L1_BLOCK_TIME }
  )
  return result
}
