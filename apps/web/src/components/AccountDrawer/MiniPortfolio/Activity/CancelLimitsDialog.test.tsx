import { ChainId, WETH9 } from '@uniswap/sdk-core'
import {
  CancelLimitsDialog,
  CancellationState,
} from 'components/AccountDrawer/MiniPortfolio/Activity/CancelLimitsDialog'
import { DAI } from 'constants/tokens'
import { UniswapXOrderStatus } from 'lib/hooks/orders/types'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { render, screen } from 'test-utils/render'

const mockOrderDetails: UniswapXOrderDetails = {
  type: SignatureType.SIGN_LIMIT,
  orderHash: '0x1234',
  status: UniswapXOrderStatus.OPEN,
  swapInfo: {
    isUniswapXOrder: true,
    type: 1,
    tradeType: 0,
    inputCurrencyId: DAI.address,
    outputCurrencyId: WETH9[ChainId.MAINNET].address,
    inputCurrencyAmountRaw: '252074033564766400000',
    expectedOutputCurrencyAmountRaw: '106841079134757921',
    minimumOutputCurrencyAmountRaw: '106841079134757921',
    settledOutputCurrencyAmountRaw: '106841079134757921',
  },
  txHash: '0x1234',
  encodedOrder: '0xencodedOrder',
  id: '0x1234',
  addedTime: 3,
  chainId: ChainId.MAINNET,
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

// TODO(WEB-3741): figure out why this test is failing locally, but not on CI
// eslint-disable-next-line jest/no-disabled-tests
describe.skip('CancelLimitsDialog', () => {
  it('should render correctly', async () => {
    const mockOnCancel = jest.fn()
    const mockOnConfirm = jest.fn()
    render(
      <CancelLimitsDialog
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        isVisible={true}
        orders={[mockOrderDetails]}
        cancelState={CancellationState.REVIEWING_CANCELLATION}
      />
    )

    expect(document.body).toMatchSnapshot()
    expect(
      screen.getByText(
        'Your swap could execute before cancellation is processed. Your network costs cannot be refunded. Do you wish to proceed?'
      )
    ).toBeInTheDocument()
  })
})
