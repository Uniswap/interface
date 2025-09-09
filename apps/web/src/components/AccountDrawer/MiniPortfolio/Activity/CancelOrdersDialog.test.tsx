import { WETH9 } from '@uniswap/sdk-core'
import {
  CancelOrdersDialog,
  CancellationState,
} from 'components/AccountDrawer/MiniPortfolio/Activity/CancelOrdersDialog'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { render, screen } from 'test-utils/render'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { DAI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyId } from 'uniswap/src/utils/currencyId'

const mockOrderDetails: UniswapXOrderDetails = {
  type: SignatureType.SIGN_UNISWAPX_ORDER,
  orderHash: '0x1234',
  status: UniswapXOrderStatus.OPEN,
  swapInfo: {
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
  offerer: '0x1234',
}

vi.mock('hooks/useTransactionGasFee', async () => {
  const actual = await vi.importActual('hooks/useTransactionGasFee')
  return {
    ...actual,
    useTransactionGasFee: vi.fn(),
  }
})

vi.mock('components/AccountDrawer/MiniPortfolio/Activity/utils', () => ({
  useCreateCancelTransactionRequest: vi.fn(),
}))

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
        orders={[{ ...mockOrderDetails, type: SignatureType.SIGN_LIMIT }]}
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
