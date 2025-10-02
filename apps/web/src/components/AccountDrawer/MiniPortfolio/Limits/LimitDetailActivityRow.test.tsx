import 'test-utils/tokens/mocks'

import { WETH9 } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { LimitDetailActivityRow } from 'components/AccountDrawer/MiniPortfolio/Limits/LimitDetailActivityRow'
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

vi.mock('components/AccountDrawer/MiniPortfolio/formatTimestamp', async () => {
  const actual = await vi.importActual('components/AccountDrawer/MiniPortfolio/formatTimestamp')
  return {
    ...actual,
    formatTimestamp: () => 'Expires January 1, 1970 at 12:00 AM',
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

describe('LimitDetailActivityRow', () => {
  it('should not render with invalid order details', () => {
    const invalidOrder = { ...mockOrderDetails, typeInfo: undefined } as any
    const { container } = render(
      <LimitDetailActivityRow order={invalidOrder} onToggleSelect={vi.fn()} selected={false} />,
    )
    expect(container.firstChild?.firstChild?.firstChild).toBeNull()
  })

  it('should render with valid details', () => {
    // Addresses a console.error -- `Warning: React does not recognize the `scaleIcon` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `scaleicon` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
    // This is from tamagui's Checkbox component`
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { container } = render(
      <LimitDetailActivityRow onToggleSelect={vi.fn()} selected={false} order={mockOrderDetails} />,
    )
    expect(container.firstChild).toMatchSnapshot()
    expect(screen.getByText('when 0.00042 WETH/DAI')).toBeInTheDocument()
  })
})
