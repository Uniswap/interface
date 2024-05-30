import 'test-utils/tokens/mocks'

import { ChainId, WETH9 } from '@uniswap/sdk-core'
import { formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import { DAI } from 'constants/tokens'
import { SignatureType } from 'state/signatures/types'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

import { UniswapXOrderStatus } from 'types/uniswapx'
import { OrderContent } from './OffchainActivityModal'

jest.mock('components/AccountDrawer/MiniPortfolio/formatTimestamp', () => ({
  formatTimestamp: jest.fn(),
}))

describe('OrderContent', () => {
  beforeEach(() => {
    mocked(formatTimestamp).mockImplementation(() => {
      return 'Mock Date' // This ensures consistent test behavior across local and CI
    })
  })
  it('should render without error, filled order', () => {
    const { container } = render(
      <OrderContent
        order={{
          txHash: '0xad7a8f73f28fd0cc16459111899dd1632164ae139fcf5281a1bced56e1ff6564',
          orderHash: '0xad7a8f73f28fd0cc16459111899dd1632164ae139fcf5281a1bced56e1ff6564',
          offerer: '0xSenderAddress',
          id: 'tx123',
          chainId: 1,
          type: SignatureType.SIGN_UNISWAPX_ORDER,
          status: UniswapXOrderStatus.FILLED,
          addedTime: 1701715079,
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
        }}
      />
    )
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('Order executed')
  })
  it('should render without error, open order', () => {
    const { container } = render(
      <OrderContent
        order={{
          chainId: 1,
          type: SignatureType.SIGN_UNISWAPX_ORDER,
          status: UniswapXOrderStatus.OPEN,
          encodedOrder: '0xencodedOrder',
          addedTime: 1701715079,
          orderHash: '0xad7a8f73f28fd0cc16459111899dd1632164ae139fcf5281a1bced56e1ff6564',
          offerer: '0xSenderAddress',
          id: 'tx123',
          swapInfo: {
            isUniswapXOrder: true,
            type: 1,
            tradeType: 0,
            inputCurrencyId: '0x6b175474e89094c44da98b954eedeac495271d0f',
            outputCurrencyId: WETH9[ChainId.MAINNET].address,
            inputCurrencyAmountRaw: '252074033564766400000',
            expectedOutputCurrencyAmountRaw: '106841079134757921',
            minimumOutputCurrencyAmountRaw: '106841079134757921',
            settledOutputCurrencyAmountRaw: '106841079134757921',
          },
        }}
      />
    )
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('Order pending')
    expect(container).toHaveTextContent('Cancel order')
  })

  it('should render without error, limit order', () => {
    const { container } = render(
      <OrderContent
        order={{
          chainId: 1,
          type: SignatureType.SIGN_LIMIT,
          status: UniswapXOrderStatus.OPEN,
          encodedOrder: '0xencodedOrder',
          addedTime: 1701715079,
          orderHash: '0xad7a8f73f28fd0cc16459111899dd1632164ae139fcf5281a1bced56e1ff6564',
          offerer: '0xSenderAddress',
          id: 'tx123',
          swapInfo: {
            isUniswapXOrder: true,
            type: 1,
            tradeType: 0,
            inputCurrencyId: '0x6b175474e89094c44da98b954eedeac495271d0f',
            outputCurrencyId: WETH9[ChainId.MAINNET].address,
            inputCurrencyAmountRaw: '252074033564766400000',
            expectedOutputCurrencyAmountRaw: '106841079134757921',
            minimumOutputCurrencyAmountRaw: '106841079134757921',
            settledOutputCurrencyAmountRaw: '106841079134757921',
          },
        }}
      />
    )
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('Limit pending')
    expect(container).toHaveTextContent('Cancel limit')
  })
})
