import { fireEvent } from '@testing-library/react-native'
import React from 'react'
import { NetworkBalanceList } from 'src/components/TokenDetails/NetworkBalanceList'
import { render } from 'src/test/test-utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

jest.mock('@universe/gating', () => ({
  ...jest.requireActual('@universe/gating'),
  useFeatureFlag: jest.fn().mockReturnValue(false),
  useFeatureFlagWithLoading: jest.fn().mockReturnValue({ value: false, isLoading: false }),
  useFeatureFlagWithExposureLoggingDisabled: jest.fn().mockReturnValue(false),
}))

function makeBalance({
  chainId,
  balanceUSD,
  quantity,
}: {
  chainId: UniverseChainId
  balanceUSD: number
  quantity: number
}): PortfolioBalance {
  return {
    id: `balance-${chainId}`,
    cacheId: `cache-${chainId}`,
    quantity,
    balanceUSD,
    relativeChange24: 0,
    isHidden: false,
    currencyInfo: {
      currencyId: `${chainId}-0xusdc`,
      currency: {
        chainId,
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        symbol: 'USDC',
        name: 'USD Coin',
        isNative: false,
        isToken: true,
      },
      logoUrl: null,
      safetyLevel: null,
      safetyInfo: null,
      isSpam: false,
    },
  } as unknown as PortfolioBalance
}

const TEST_BALANCES: PortfolioBalance[] = [
  makeBalance({ chainId: UniverseChainId.Mainnet, balanceUSD: 3209.44, quantity: 3209.44 }),
  makeBalance({ chainId: UniverseChainId.Base, balanceUSD: 1654.32, quantity: 1654.32 }),
]

describe(NetworkBalanceList, () => {
  const defaultProps = {
    balances: TEST_BALANCES,
    onSelectBalance: jest.fn(),
  }

  beforeEach(() => jest.clearAllMocks())

  it('renders chain names for each balance', () => {
    const { queryByText } = render(<NetworkBalanceList {...defaultProps} />)

    expect(queryByText('Ethereum')).toBeTruthy()
    expect(queryByText('Base')).toBeTruthy()
  })

  it('renders a row for each balance', () => {
    const { getAllByTestId } = render(<NetworkBalanceList {...defaultProps} />)

    const rows = getAllByTestId(TestID.NetworkBalanceRow)
    expect(rows).toHaveLength(2)
  })

  it('calls onSelectBalance with the correct balance when a row is pressed', () => {
    const onSelectBalance = jest.fn()
    const { getAllByTestId } = render(<NetworkBalanceList {...defaultProps} onSelectBalance={onSelectBalance} />)

    const rows = getAllByTestId(TestID.NetworkBalanceRow)
    fireEvent.press(rows[0]!, ON_PRESS_EVENT_PAYLOAD)

    expect(onSelectBalance).toHaveBeenCalledTimes(1)
    expect(onSelectBalance).toHaveBeenCalledWith(
      expect.objectContaining({
        currencyInfo: expect.objectContaining({
          currency: expect.objectContaining({ chainId: expect.any(Number) }),
        }),
      }),
    )
  })

  it('renders empty state when no balances are provided', () => {
    const { queryByTestId } = render(<NetworkBalanceList {...defaultProps} balances={[]} />)

    expect(queryByTestId(TestID.NetworkBalanceRow)).toBeNull()
  })

  it('renders fiat and token amounts for each balance', () => {
    const { getByText } = render(<NetworkBalanceList {...defaultProps} />)

    expect(getByText('$3,209.44')).toBeTruthy()
    expect(getByText('$1,654.32')).toBeTruthy()
    expect(getByText(/3,209.44 USDC/)).toBeTruthy()
    expect(getByText(/1,654.32 USDC/)).toBeTruthy()
  })

  it('passes the specific pressed balance to onSelectBalance', () => {
    const onSelectBalance = jest.fn()
    const { getAllByTestId } = render(<NetworkBalanceList {...defaultProps} onSelectBalance={onSelectBalance} />)

    const rows = getAllByTestId(TestID.NetworkBalanceRow)
    fireEvent.press(rows[1]!, ON_PRESS_EVENT_PAYLOAD)

    expect(onSelectBalance).toHaveBeenCalledTimes(1)
    expect(onSelectBalance).toHaveBeenCalledWith(
      expect.objectContaining({
        currencyInfo: expect.objectContaining({
          currency: expect.objectContaining({ chainId: UniverseChainId.Base }),
        }),
      }),
    )
  })

  it('renders a single row when only one balance is provided', () => {
    const singleBalance = [TEST_BALANCES[0]!]
    const { getAllByTestId, queryByText } = render(<NetworkBalanceList {...defaultProps} balances={singleBalance} />)

    expect(getAllByTestId(TestID.NetworkBalanceRow)).toHaveLength(1)
    expect(queryByText('Ethereum')).toBeTruthy()
    expect(queryByText('Base')).toBeNull()
  })

  it('sorts balances in descending order by fiat value', () => {
    const unsortedBalances = [
      makeBalance({ chainId: UniverseChainId.Base, balanceUSD: 100, quantity: 100 }),
      makeBalance({ chainId: UniverseChainId.ArbitrumOne, balanceUSD: 5000, quantity: 5000 }),
      makeBalance({ chainId: UniverseChainId.Mainnet, balanceUSD: 500, quantity: 500 }),
    ]
    const { getAllByText } = render(<NetworkBalanceList {...defaultProps} balances={unsortedBalances} />)

    const fiatTexts = getAllByText(/^\$[\d,]+/)
    expect(fiatTexts[0]?.props['children']).toBe('$5,000.00')
    expect(fiatTexts[1]?.props['children']).toBe('$500.00')
    expect(fiatTexts[2]?.props['children']).toBe('$100.00')
  })
})
