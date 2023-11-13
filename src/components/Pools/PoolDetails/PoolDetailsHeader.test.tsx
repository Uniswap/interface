import userEvent from '@testing-library/user-event'
import store from 'state'
import { addSerializedToken } from 'state/user/reducer'
import { act, render, screen } from 'test-utils/render'

import { PoolDetailsHeader } from './PoolDetailsHeader'

describe('PoolDetailsHeader', () => {
  beforeEach(() => {
    store.dispatch(
      addSerializedToken({
        serializedToken: {
          chainId: 1,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
      })
    )
    store.dispatch(
      addSerializedToken({
        serializedToken: {
          chainId: 1,
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
        },
      })
    )
  })

  const mockProps = {
    chainId: 1,
    poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
    token0: { id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC' },
    token1: { id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', symbol: 'WETH' },
    feeTier: 500,
    toggleReversed: jest.fn(),
  }

  it('loading skeleton is shown', () => {
    const { asFragment } = render(<PoolDetailsHeader {...mockProps} loading={true} />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByTestId('pdp-header-loading-skeleton')).toBeInTheDocument()
  })

  it('renders header text correctly', () => {
    const { asFragment } = render(<PoolDetailsHeader {...mockProps} />)
    expect(asFragment()).toMatchSnapshot()

    expect(screen.getByText(/Explore/i)).toBeInTheDocument()
    expect(screen.getByText(/Pool/i)).toBeInTheDocument()
    expect(screen.getByText(/USDC \/ WETH \(0x88e6...5640\)/i)).toBeInTheDocument()
    expect(screen.getByText('0.05%')).toBeInTheDocument()
  })

  it('calls toggleReversed when arrows are clicked', async () => {
    render(<PoolDetailsHeader {...mockProps} />)

    await act(() => userEvent.click(screen.getByTestId('toggle-tokens-reverse-arrows')))

    expect(mockProps.toggleReversed).toHaveBeenCalledTimes(1)
  })
})
