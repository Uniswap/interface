import { TradingApi } from '@universe/api'
import { useOpenLimitOrders } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { OpenLimitOrdersButton } from 'components/AccountDrawer/MiniPortfolio/Limits/OpenLimitOrdersButton'
import { mocked } from 'test-utils/mocked'
import { fireEvent, render, screen } from 'test-utils/render'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'

vi.mock('components/AccountDrawer/MiniPortfolio/Activity/hooks', async () => {
  const actual = await vi.importActual('components/AccountDrawer/MiniPortfolio/Activity/hooks')
  return {
    ...actual,
    useOpenLimitOrders: vi.fn(),
  }
})

const mockLimitActivity: UniswapXOrderDetails = {
  id: '0x123',
  hash: '0x123',
  orderHash: '0x123',
  chainId: UniverseChainId.Mainnet,
  status: TransactionStatus.Pending,
  from: '0x456',
  routing: TradingApi.Routing.DUTCH_LIMIT,
  addedTime: Date.now(),
  transactionOriginType: TransactionOriginType.Internal,
  typeInfo: {
    type: TransactionType.Swap,
    tradeType: 0,
    inputCurrencyId: 'ETH',
    outputCurrencyId: 'DAI',
    inputCurrencyAmountRaw: '1000000000000000000',
    expectedOutputCurrencyAmountRaw: '2000000000000000000',
    minimumOutputCurrencyAmountRaw: '2000000000000000000',
    settledOutputCurrencyAmountRaw: '2000000000000000000',
    isUniswapXOrder: true,
  },
}

describe('OpenLimitOrdersButton', () => {
  it('should not render if there are no open limit orders', () => {
    mocked(useOpenLimitOrders).mockReturnValue({ openLimitOrders: [], loading: false })
    const { container } = render(<OpenLimitOrdersButton account="0x123" openLimitsMenu={vi.fn()} />)
    expect(container.firstChild?.firstChild?.firstChild).toBeNull()
  })
  it('should render if there are open limit orders', () => {
    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: [mockLimitActivity],
      loading: false,
    })
    const { container } = render(<OpenLimitOrdersButton account="0x123" openLimitsMenu={vi.fn()} />)
    expect(container).toMatchSnapshot()
    expect(screen.getByText('1 open limit')).toBeInTheDocument()
  })
  it('should call the callback when clicked', () => {
    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: [mockLimitActivity],
      loading: false,
    })
    const clickCallback = vi.fn()
    render(<OpenLimitOrdersButton account="0x123" openLimitsMenu={clickCallback} />)

    // Find and click the button element
    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(clickCallback).toHaveBeenCalled()
  })
  it('should have a warning when the limit is reached', () => {
    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: Array(100).fill(mockLimitActivity),
      loading: false,
    })
    render(<OpenLimitOrdersButton account="0x123" openLimitsMenu={vi.fn()} />)
    expect(screen.getByText('Cancel limits to proceed')).toBeInTheDocument()
  })

  it('should have a warning when the limit is almost reached', () => {
    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: Array(90).fill(mockLimitActivity),
      loading: false,
    })
    render(<OpenLimitOrdersButton account="0x123" openLimitsMenu={vi.fn()} />)
    expect(screen.getByText('Approaching 100 limit maximum')).toBeInTheDocument()
  })
})
