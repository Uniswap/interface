import { ChainId, CurrencyAmount, WETH9 } from '@uniswap/sdk-core'
import { DAI, USDC_MAINNET } from 'constants/tokens'
import { UniswapXOrderStatus } from 'lib/hooks/orders/types'
import { SignatureType } from 'state/signatures/types'
import { render, screen } from 'test-utils/render'

import { OffchainOrderLineItem, OffchainOrderLineItemType } from './OffchainOrderLineItem'

describe('OffchainOrderLineItem', () => {
  it('should render type EXCHANGE_RATE', () => {
    const { asFragment } = render(
      <OffchainOrderLineItem
        type={OffchainOrderLineItemType.EXCHANGE_RATE}
        amounts={{
          inputAmount: CurrencyAmount.fromRawAmount(DAI, 1),
          outputAmount: CurrencyAmount.fromRawAmount(USDC_MAINNET, 1),
        }}
      />
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText('Rate')).toBeInTheDocument()
  })

  it('should render type EXPIRY', () => {
    render(
      <OffchainOrderLineItem
        type={OffchainOrderLineItemType.EXPIRY}
        order={{
          txHash: '0x123',
          orderHash: '0x123',
          offerer: '0xSenderAddress',
          id: 'tx123',
          chainId: 1,
          type: SignatureType.SIGN_UNISWAPX_ORDER,
          status: UniswapXOrderStatus.FILLED,
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
          addedTime: 1,
          expiry: 2,
        }}
      />
    )
    expect(screen.getByText('Expiry')).toBeInTheDocument()
  })

  it('should render type NETWORK_COST', () => {
    const { asFragment } = render(<OffchainOrderLineItem type={OffchainOrderLineItemType.NETWORK_COST} />)
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText('Network cost')).toBeInTheDocument()
  })

  it('should render type TRANSACTION_ID', () => {
    const { asFragment } = render(
      <OffchainOrderLineItem
        type={OffchainOrderLineItemType.TRANSACTION_ID}
        explorerLink="https://etherscan.io/tx/0x123"
        order={{
          txHash: '0x123',
          orderHash: '0x123',
          offerer: '0xSenderAddress',
          id: 'tx123',
          chainId: 1,
          type: SignatureType.SIGN_UNISWAPX_ORDER,
          status: UniswapXOrderStatus.FILLED,
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
          addedTime: 1,
          expiry: 2,
        }}
      />
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText('Transaction ID')).toBeInTheDocument()
  })
})
