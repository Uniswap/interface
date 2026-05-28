import { QueryResult } from '@apollo/client'
import { GraphQLApi } from '@universe/api'

export const validTokenProjectResponse = {
  data: {
    token: {
      id: 'VG9rZW46RVRIRVJFVU1fMHhBMGI4Njk5MWM2MjE4YjM2YzFkMTlENGEyZTlFYjBjRTM2MDZlQjQ4',
      decimals: 6,
      name: 'USD Coin',
      chain: 'ETHEREUM',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      standard: 'ERC20',
      project: {
        id: 'VG9rZW5Qcm9qZWN0OkVUSEVSRVVNXzB4YTBiODY5OTFjNjIxOGIzNmMxZDE5ZDRhMmU5ZWIwY2UzNjA2ZWI0OF9VU0RD',
        description:
          'USDC is a fully collateralized US dollar stablecoin. USDC is the bridge between dollars and trading on cryptocurrency exchanges. The technology behind CENTRE makes it possible to exchange value between people, businesses and financial institutions just like email between mail services and texts between SMS providers. We believe by removing artificial economic borders, we can create a more inclusive global economy.',
        homepageUrl: 'https://www.circle.com/en/usdc',
        twitterName: 'circle',
        logoUrl:
          'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        __typename: 'TokenProject',
      },
      __typename: 'Token',
    },
  },
} as unknown as QueryResult<
  GraphQLApi.TokenProjectWebQuery,
  GraphQLApi.Exact<{ chain: GraphQLApi.Chain; address?: string }>
>
