import { QueryResult } from '@apollo/client'
import userEvent from '@testing-library/user-event'
import { USDC_MAINNET } from 'constants/tokens'
import { Chain, Exact, TokenProjectQuery, useTokenProjectQuery } from 'graphql/data/__generated__/types-and-hooks'
import { useCurrency } from 'hooks/Tokens'
import { mocked } from 'test-utils/mocked'
import { validTokenProjectResponse, validUSDCCurrency } from 'test-utils/pools/fixtures'
import { act, render, screen } from 'test-utils/render'

import { TokenDescription } from './TokenDescription'

jest.mock('graphql/data/__generated__/types-and-hooks', () => {
  const originalModule = jest.requireActual('graphql/data/__generated__/types-and-hooks')
  return {
    ...originalModule,
    useTokenProjectQuery: jest.fn(),
  }
})

jest.mock('hooks/Tokens', () => {
  const originalModule = jest.requireActual('hooks/Tokens')
  return {
    ...originalModule,
    useCurrency: jest.fn(),
  }
})

const tokenAddress = USDC_MAINNET.address

describe('TokenDescription', () => {
  beforeEach(() => {
    mocked(useTokenProjectQuery).mockReturnValue(validTokenProjectResponse)
    mocked(useCurrency).mockReturnValue(validUSDCCurrency)
  })

  it('renders token information correctly with defaults', () => {
    const { asFragment } = render(<TokenDescription tokenAddress={tokenAddress} showCopy />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText('USDC')).toBeVisible()
    expect(screen.getByText('USDCoin')).toBeVisible()
    expect(screen.getByText('Website')).toBeVisible()
    expect(screen.getByText('Twitter')).toBeVisible()
    expect(screen.getByText('Etherscan')).toBeVisible()
    expect(screen.getByText('0xA0b8...eB48')).toBeVisible()
  })

  it('truncates description and shows more', async () => {
    const { asFragment } = render(<TokenDescription tokenAddress={tokenAddress} showCopy />)

    expect(asFragment()).toMatchSnapshot()
    const truncatedDescription = screen.getByTestId('token-description-truncated')
    const fullDescription = screen.getByTestId('token-description-full')

    expect(truncatedDescription).toHaveStyleRule('display', 'inline')
    expect(fullDescription).toHaveStyleRule('display', 'none')

    await act(() => userEvent.click(screen.getByText('Show more')))
    expect(truncatedDescription).toHaveStyleRule('display', 'none')
    expect(fullDescription).toHaveStyleRule('display', 'inline')
    expect(screen.getByText('Hide')).toBeVisible()
  })

  it('copy address button hidden when flagged', async () => {
    const { asFragment } = render(<TokenDescription tokenAddress={tokenAddress} />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.queryByText('0xA0b8...eB48')).toBeNull()
  })

  it('no description or social buttons shown when not available', async () => {
    mocked(useTokenProjectQuery).mockReturnValue({ data: undefined } as unknown as QueryResult<
      TokenProjectQuery,
      Exact<{ chain: Chain; address?: string }>
    >)
    const { asFragment } = render(<TokenDescription tokenAddress={tokenAddress} showCopy />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText('No token information available')).toBeVisible()
    expect(screen.queryByText('Website')).toBeNull()
    expect(screen.queryByText('Twitter')).toBeNull()
    expect(screen.getByText('Etherscan')).toBeVisible()
    expect(screen.getByText('0xA0b8...eB48')).toBeVisible()
  })
})
