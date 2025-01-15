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

const mockOrderDetails: UniswapXOrderDetails = {
  type: SignatureType.SIGN_UNISWAPX_ORDER,
  orderHash: '0x1234',
  status: UniswapXOrderStatus.OPEN,
  swapInfo: {
    isUniswapXOrder: true,
    type: 1,
    tradeType: 0,
    inputCurrencyId: DAI.address,
    outputCurrencyId: WETH9[UniverseChainId.Mainnet].address,
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

jest.mock('hooks/useTransactionGasFee', () => ({
  ...jest.requireActual('hooks/useTransactionGasFee'),
  useTransactionGasFee: jest.fn(),
}))

jest.mock('components/AccountDrawer/MiniPortfolio/Activity/utils', () => ({
  useCreateCancelTransactionRequest: jest.fn(),
}))

jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('CancelOrdersDialog', () => {
  it('should render order cancel correctly', async () => {
    const mockOnCancel = jest.fn()
    const mockOnConfirm = jest.fn()
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
    const mockOnCancel = jest.fn()
    const mockOnConfirm = jest.fn()
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
