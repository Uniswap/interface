import 'test-utils/tokens/mocks'

import { WETH9 } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { useOpenLimitOrders } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { LimitsMenu } from 'components/AccountDrawer/MiniPortfolio/Limits/LimitsMenu'
import { mocked } from 'test-utils/mocked'
import { act, fireEvent, render, screen } from 'test-utils/render'
import { DAI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyId } from 'uniswap/src/utils/currencyId'

vi.mock('components/AccountDrawer/MiniPortfolio/Activity/hooks', async () => {
  const actual = await vi.importActual('components/AccountDrawer/MiniPortfolio/Activity/hooks')
  return {
    ...actual,
    useOpenLimitOrders: vi.fn(),
  }
})

vi.mock('components/AccountDrawer/MiniPortfolio/formatTimestamp', async () => {
  const actual = await vi.importActual('components/AccountDrawer/MiniPortfolio/formatTimestamp')
  return {
    ...actual,
    formatTimestamp: () => 'January 26, 2024 at 1:52PM',
  }
})

const mockOrderDetails: UniswapXOrderDetails = {
  routing: TradingApi.Routing.DUTCH_LIMIT,
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

describe('LimitsMenu', () => {
  it('should render when there is one open order', async () => {
    // Addresses a console.error -- `Warning: React does not recognize the `scaleIcon` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `scaleicon` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
    // This is from tamagui's Checkbox component`
    vi.spyOn(console, 'error').mockImplementation(() => {})

    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: [mockOrderDetails],
      loading: false,
    })

    await act(async () => {
      return render(<LimitsMenu onClose={vi.fn()} account="0x123" />)
    })
    // TODO(WEB-4881): re-enable after identifying issue with tamagui snapshots on CI
    // expect(container).toMatchSnapshot()
    expect(screen.getByText('Open limits')).toBeInTheDocument()
    expect(screen.getByTestId('LimitsMenuContainer').children.length).toEqual(1) // one order
  })

  it('should render when there are two open orders', async () => {
    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: [mockOrderDetails, { ...mockOrderDetails, id: '0x456', orderHash: '0x456', hash: '0x456' }],
      loading: false,
    })
    await act(async () => {
      return render(<LimitsMenu onClose={vi.fn()} account="0x123" />)
    })
    // TODO(WEB-4881): re-enable after identifying issue with tamagui snapshots on CI
    // expect(container).toMatchSnapshot()
    expect(screen.getByText('Open limits')).toBeInTheDocument()
    expect(screen.getByTestId('LimitsMenuContainer').children.length).toEqual(2) // two orders
  })

  it('should call the close callback', async () => {
    const onClose = vi.fn()
    mocked(useOpenLimitOrders).mockReturnValue({
      openLimitOrders: [mockOrderDetails],
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
