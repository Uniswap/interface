import { WETH9 } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import {
  CancellationState,
  CancelOrdersDialog,
} from 'components/AccountDrawer/MiniPortfolio/Activity/CancelOrdersDialog'
import { render, screen } from 'test-utils/render'
import { DAI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { vi } from 'vitest'

const mockOrderDetails: UniswapXOrderDetails = {
  routing: TradingApi.Routing.DUTCH_V2,
  orderHash: '0x1234',
  status: TransactionStatus.Pending,
  typeInfo: {
    isUniswapXOrder: true,
    type: TransactionType.Swap,
    tradeType: 0,
    inputCurrencyId: currencyId(DAI),
    outputCurrencyId: currencyId(WETH9[UniverseChainId.Mainnet]),
    inputCurrencyAmountRaw: '252074033564766400000',
    expectedOutputCurrencyAmountRaw: '106841079134757921',
    minimumOutputCurrencyAmountRaw: '106841079134757921',
    settledOutputCurrencyAmountRaw: '106841079134757921',
  },
  encodedOrder: '0xencodedOrder',
  id: '0x1234',
  addedTime: 3,
  chainId: UniverseChainId.Mainnet,
  expiry: 4,
  from: '0x1234',
  transactionOriginType: TransactionOriginType.Internal,
}

vi.mock('components/AccountDrawer/MiniPortfolio/Activity/hooks', async () => {
  const actual = await vi.importActual('components/AccountDrawer/MiniPortfolio/Activity/hooks')
  return {
    ...actual,
    useCancelOrdersGasEstimate: vi.fn(),
    usePendingActivity: vi.fn(() => ({
      pendingActivityCount: 0,
      hasPendingActivity: false,
    })),
  }
})

vi.mock('hooks/useTransactionGasFee', async () => {
  const actual = await vi.importActual('hooks/useTransactionGasFee')
  return {
    ...actual,
    useTransactionGasFee: vi.fn(),
  }
})

vi.mock('utilities/src/logger/logger', async () => {
  const actual = await vi.importActual('utilities/src/logger/logger')
  return {
    ...actual,
    logger: {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      setDatadogEnabled: vi.fn(),
    },
  }
})

describe('CancelOrdersDialog', () => {
  it('should render order cancel correctly', async () => {
    const mockOnCancel = vi.fn()
    const mockOnConfirm = vi.fn()
    render(
      <CancelOrdersDialog
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        isVisible={true}
        orders={[mockOrderDetails]}
        cancelState={CancellationState.REVIEWING_CANCELLATION}
      />,
    )

    expect(document.body).toMatchSnapshot()
    expect(screen.getByText('Cancel order')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Your swap could execute before cancellation is processed. Your network costs cannot be refunded. Do you wish to proceed?',
      ),
    ).toBeInTheDocument()
  })
  it('should render limit order text', async () => {
    const mockOnCancel = vi.fn()
    const mockOnConfirm = vi.fn()
    render(
      <CancelOrdersDialog
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        isVisible={true}
        orders={[{ ...mockOrderDetails, routing: TradingApi.Routing.DUTCH_LIMIT }]}
        cancelState={CancellationState.REVIEWING_CANCELLATION}
      />,
    )

    expect(document.body).toMatchSnapshot()
    expect(screen.getByText('Cancel limit')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Your swap could execute before cancellation is processed. Your network costs cannot be refunded. Do you wish to proceed?',
      ),
    ).toBeInTheDocument()
  })
})
