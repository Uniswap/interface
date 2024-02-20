import { ChainId } from '@uniswap/sdk-core'
import { useOpenLimitOrders } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { OpenLimitOrdersButton } from 'components/AccountDrawer/MiniPortfolio/Limits/OpenLimitOrdersButton'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { mocked } from 'test-utils/mocked'
import { act, fireEvent, render, screen } from 'test-utils/render'

jest.mock('components/AccountDrawer/MiniPortfolio/Activity/hooks', () => ({
  useOpenLimitOrders: jest.fn(),
}))

const mockLimitActivity = {
  hash: '0x123',
  chainId: ChainId.MAINNET,
  status: TransactionStatus.Pending,
  timestamp: 1,
  title: 'Limit pending',
  from: '0x456',
}

describe('OpenLimitOrdersButton', () => {
  it('should not render if there are no open limit orders', () => {
    mocked(useOpenLimitOrders).mockReturnValue({ openLimitOrders: [], loading: false, refetch: jest.fn() })
    const { container } = render(<OpenLimitOrdersButton account="0x123" openLimitsMenu={jest.fn()} />)
    expect(container.firstChild?.firstChild?.firstChild).toBeNull()
  })
  it('should render if there are open limit orders', () => {
    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: [mockLimitActivity],
      loading: false,
      refetch: jest.fn(),
    })
    const { container } = render(<OpenLimitOrdersButton account="0x123" openLimitsMenu={jest.fn()} />)
    expect(container).toMatchSnapshot()
    expect(screen.getByText('1 open limit')).toBeInTheDocument()
  })
  it('should call the callback when clicked', () => {
    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: [mockLimitActivity],
      loading: false,
      refetch: jest.fn(),
    })
    const clickCallback = jest.fn()
    const { container } = render(<OpenLimitOrdersButton account="0x123" openLimitsMenu={clickCallback} />)
    act(() => {
      fireEvent.click(container.firstChild?.firstChild?.firstChild as HTMLElement)
    })
    expect(clickCallback).toHaveBeenCalled()
  })
  it('should have a warning when the limit is reached', () => {
    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: Array(100).fill(mockLimitActivity),
      loading: false,
      refetch: jest.fn(),
    })
    render(<OpenLimitOrdersButton account="0x123" openLimitsMenu={jest.fn()} />)
    expect(screen.getByText('Cancel limits to proceed')).toBeInTheDocument()
  })

  it('should have a warning when the limit is almost reached', () => {
    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: Array(90).fill(mockLimitActivity),
      loading: false,
      refetch: jest.fn(),
    })
    render(<OpenLimitOrdersButton account="0x123" openLimitsMenu={jest.fn()} />)
    expect(screen.getByText('Approaching 100 limit maximum')).toBeInTheDocument()
  })
})
