import 'test-utils/tokens/mocks'

import { ChainId, WETH9 } from '@uniswap/sdk-core'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { LimitDetailActivityRow } from 'components/AccountDrawer/MiniPortfolio/Limits/LimitDetailActivityRow'
import { DAI } from 'constants/tokens'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { render, screen } from 'test-utils/render'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

jest.mock('components/AccountDrawer/MiniPortfolio/formatTimestamp', () => {
  return {
    ...jest.requireActual('components/AccountDrawer/MiniPortfolio/formatTimestamp'),
    formatTimestamp: () => 'Expires January 1, 1970 at 12:00 AM',
  }
})

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

const mockOrder: Activity = {
  hash: '0x123',
  chainId: ChainId.MAINNET,
  status: TransactionStatus.Pending,
  timestamp: 1,
  title: 'Limit pending',
  from: '0x456',
  offchainOrderDetails: mockOrderDetails,
  currencies: [DAI, WETH9[ChainId.MAINNET]],
}

describe('LimitDetailActivityRow', () => {
  it('should not render with invalid details', () => {
    const { container } = render(
      <LimitDetailActivityRow
        order={{ ...mockOrder, offchainOrderDetails: undefined }}
        onToggleSelect={jest.fn()}
        selected={false}
      />
    )
    expect(container.firstChild?.firstChild?.firstChild).toBeNull()
  })

  it('should not render with invalid amounts', () => {
    const { container } = render(
      <LimitDetailActivityRow
        onToggleSelect={jest.fn()}
        selected={false}
        order={{ ...mockOrder, offchainOrderDetails: { ...mockOrderDetails, swapInfo: undefined as any } }}
      />
    )
    expect(container.firstChild?.firstChild?.firstChild).toBeNull()
  })

  it('should render with valid details', () => {
    const { container } = render(
      <LimitDetailActivityRow onToggleSelect={jest.fn()} selected={false} order={mockOrder} />
    )
    expect(container.firstChild).toMatchSnapshot()
    expect(screen.getByText('when 0.00042 WETH/DAI')).toBeInTheDocument()
  })
})
