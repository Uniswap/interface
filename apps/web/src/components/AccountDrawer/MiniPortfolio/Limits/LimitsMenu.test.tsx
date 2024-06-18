import 'test-utils/tokens/mocks'

import { ChainId, WETH9 } from '@taraswap/sdk-core'
import { useOpenLimitOrders } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { LimitsMenu } from 'components/AccountDrawer/MiniPortfolio/Limits/LimitsMenu'
import { DAI } from 'constants/tokens'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { mocked } from 'test-utils/mocked'
import { act, fireEvent, render, screen } from 'test-utils/render'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

jest.mock('components/AccountDrawer/MiniPortfolio/Activity/hooks', () => ({
  ...jest.requireActual('components/AccountDrawer/MiniPortfolio/Activity/hooks'),
  useOpenLimitOrders: jest.fn(),
}))

jest.mock('components/AccountDrawer/MiniPortfolio/formatTimestamp', () => ({
  ...jest.requireActual('components/AccountDrawer/MiniPortfolio/formatTimestamp'),
  formatTimestamp: () => 'January 26, 2024 at 1:52PM',
}))

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
  encodedOrder: '0xencodedOrder',
  id: '0x1234',
  addedTime: 3,
  chainId: ChainId.MAINNET,
  expiry: 4,
  offerer: '0x1234',
}

const mockLimitActivity: Activity = {
  hash: '0x123',
  chainId: ChainId.MAINNET,
  status: TransactionStatus.Pending,
  timestamp: 1,
  title: 'Limit pending',
  from: '0x456',
  offchainOrderDetails: mockOrderDetails,
}

describe('LimitsMenu', () => {
  it('should render when there is one open order', async () => {
    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: [mockLimitActivity],
      loading: false,
    })

    const { container } = await act(async () => {
      return render(<LimitsMenu onClose={jest.fn()} account="0x123" />)
    })
    expect(container).toMatchSnapshot()
    expect(screen.getByText('Open limits')).toBeInTheDocument()
    expect(screen.getByTestId('LimitsMenuContainer').children.length).toEqual(1) // one order
  })

  it('should render when there are two open orders', async () => {
    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: [mockLimitActivity, { ...mockLimitActivity, hash: '0x456' }],
      loading: false,
    })
    const { container } = await act(async () => {
      return render(<LimitsMenu onClose={jest.fn()} account="0x123" />)
    })
    expect(container).toMatchSnapshot()
    expect(screen.getByText('Open limits')).toBeInTheDocument()
    expect(screen.getByTestId('LimitsMenuContainer').children.length).toEqual(2) // two orders
  })

  it('should call the close callback', async () => {
    const onClose = jest.fn()
    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: [mockLimitActivity],
      loading: false,
    })
    await act(async () => {
      render(<LimitsMenu onClose={onClose} account="0x123" />)
    })
    act(() => {
      fireEvent.click(screen.getByTestId('wallet-back'))
    })
    expect(onClose).toHaveBeenCalled()
  })
})
