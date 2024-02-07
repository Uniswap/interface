import { ChainId, WETH9 } from '@uniswap/sdk-core'
import { CancelLimitsDialog } from 'components/AccountDrawer/MiniPortfolio/Activity/CancelLimitsDialog'
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

describe('CancelLimitsDialog', () => {
  it('should render correctly', () => {
    const mockOnCancel = jest.fn()
    const mockOnConfirm = jest.fn()
    render(
      <CancelLimitsDialog
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        isVisible={true}
        orders={[mockOrderDetails]}
        cancelling={false}
      />
    )

    expect(document.body).toMatchSnapshot()
    expect(
      screen.getByText('Are you sure you want to cancel your limit before it executes or expires?')
    ).toBeInTheDocument()
  })
})
