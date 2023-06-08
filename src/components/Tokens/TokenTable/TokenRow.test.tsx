import { SupportedChainId } from 'constants/chains'
import { Currency, TokenStandard } from 'graphql/data/__generated__/types-and-hooks'
import { CHAIN_ID_TO_BACKEND_NAME } from 'graphql/data/util'
import { render, screen } from 'test-utils/render'

import { LoadedRow } from './TokenRow'

const sparklineData = [
  {
    __typename: 'TimestampedAmount',
    id: 'VGltZXN0YW1wZWRBbW91bnQ6Ni41MjM1MTI1NzI1Nzc0MDZfMTY4NTk3NjkzNV9VU0Q=',
    timestamp: 1685976935,
    value: 6.523512572577406,
  },
  {
    __typename: 'TimestampedAmount',
    id: 'VGltZXN0YW1wZWRBbW91bnQ6Ni41MDQ2NTU5Njk1ODg3NzJfMTY4NTk3NzUzNV9VU0Q=',
    timestamp: 1685977535,
    value: 6.504655969588772,
  },
  {
    __typename: 'TimestampedAmount',
    id: 'VGltZXN0YW1wZWRBbW91bnQ6Ni40NzU2MTY0ODczODQ0NDlfMTY4NTk3ODEzNV9VU0Q=',
    timestamp: 1685978135,
    value: 6.475616487384449,
  },
]

const market = {
  __typename: 'TokenMarket' as const,
  id: 'VG9rZW5NYXJrZXQ6RVRIRVJFVU1fMHhBMGI4Njk5MWM2MjE4YjM2YzFkMTlENGEyZTlFYjBjRTM2MDZlQjQ4X1VTRA==',
  totalValueLocked: {
    __typename: 'Amount' as const,
    id: 'QW1vdW50OjY3NDY2MDI0OC43Njk5ODdfVVNE',
    value: 674660248.769987,
    currency: Currency.Usd,
  },
  price: {
    __typename: 'Amount' as const,
    id: 'QW1vdW50OjAuOTk5OTk5OTk5OTk5OTk5OV9VU0Q=',
    value: 0.9999999999999999,
    currency: Currency.Usd,
  },
  pricePercentChange: {
    __typename: 'Amount' as const,
    id: 'QW1vdW50OjBfVVNE',
    currency: Currency.Usd,
    value: 0,
  },
  volume: {
    __typename: 'Amount' as const,
    id: 'QW1vdW50OjQ0NDc0NDcwMy4yNTQ2Mzg3X1VTRA==',
    value: 444744703.2546387,
    currency: Currency.Usd,
  },
}

const project = {
  __typename: 'TokenProject' as const,
  id: 'VG9rZW5Qcm9qZWN0OkVUSEVSRVVNXzB4YTBiODY5OTFjNjIxOGIzNmMxZDE5ZDRhMmU5ZWIwY2UzNjA2ZWI0OA==',
  logoUrl:
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
}

describe('LoadedRow.tsx', () => {
  it('renders a row', () => {
    const { asFragment } = render(
      <LoadedRow
        tokenListIndex={0}
        tokenListLength={1}
        token={{
          __typename: 'Token',
          id: 'VG9rZW46RVRIRVJFVU1fMHhBMGI4Njk5MWM2MjE4YjM2YzFkMTlENGEyZTlFYjBjRTM2MDZlQjQ4',
          name: 'USD Coin',
          chain: CHAIN_ID_TO_BACKEND_NAME[SupportedChainId.MAINNET],
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          symbol: 'USDC',
          standard: TokenStandard.Erc20,
          market,
          project,
        }}
        sparklineMap={{ '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': sparklineData }}
        sortRank={2}
      />
    )
    expect(asFragment()).toMatchSnapshot()
  })

  it('should render "-" as the price when it receives a 0 value', () => {
    const newMarket = { ...market, price: { ...market.price, value: 0 } }
    render(
      <LoadedRow
        tokenListIndex={0}
        tokenListLength={1}
        token={{
          __typename: 'Token',
          id: 'VG9rZW46RVRIRVJFVU1fMHhBMGI4Njk5MWM2MjE4YjM2YzFkMTlENGEyZTlFYjBjRTM2MDZlQjQ4',
          name: 'USD Coin',
          chain: CHAIN_ID_TO_BACKEND_NAME[SupportedChainId.MAINNET],
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          symbol: 'USDC',
          standard: TokenStandard.Erc20,
          market: newMarket,
          project,
        }}
        sparklineMap={{ '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': sparklineData }}
        sortRank={2}
      />
    )
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
