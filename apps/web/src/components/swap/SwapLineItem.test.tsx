import 'test-utils/tokens/mocks'

import SwapLineItem, { SwapLineItemType } from 'components/swap/SwapLineItem'
import { InterfaceTrade } from 'state/routing/types'
import {
  LIMIT_ORDER_TRADE,
  PREVIEW_EXACT_IN_TRADE,
  TEST_ALLOWED_SLIPPAGE,
  TEST_DUTCH_TRADE_ETH_INPUT,
  TEST_DUTCH_V2_TRADE_ETH_INPUT,
  TEST_TRADE_EXACT_INPUT,
  TEST_TRADE_EXACT_INPUT_API,
  TEST_TRADE_EXACT_OUTPUT,
  TEST_TRADE_FEE_ON_BUY,
  TEST_TRADE_FEE_ON_SELL,
} from 'test-utils/constants'
import { render, screen } from 'test-utils/render'

// Forces tooltips to render in snapshots
vi.mock('react-dom', () => {
  const original = vi.importActual('react-dom')
  return {
    ...original,
    createPortal: (node: any) => node,
  }
})

// Prevents uuid from generating unpredictable values in snapshots
vi.mock('uuid', () => ({
  v4: () => 'fixed-uuid-value',
}))

const AllLineItemsTypes = Object.keys(SwapLineItemType).map(Number).filter(Boolean)
const lineItemProps = {
  syncing: false,
  allowedSlippage: TEST_ALLOWED_SLIPPAGE,
}

function testTradeLineItems(trade: InterfaceTrade, props: Partial<typeof lineItemProps> = {}) {
  const { asFragment } = render(
    <>
      {AllLineItemsTypes.map((type) => (
        <SwapLineItem key={type} trade={trade} type={type} {...lineItemProps} {...props} />
      ))}
    </>,
  )
  expect(asFragment()).toMatchSnapshot()
}

/* eslint-disable jest/expect-expect */ // allow expect inside testTradeLineItems
describe('SwapLineItem.tsx', () => {
  it('exact input', () => {
    testTradeLineItems(TEST_TRADE_EXACT_INPUT)
  })
  it('exact output', () => {
    testTradeLineItems(TEST_TRADE_EXACT_OUTPUT)
  })
  it('fee on buy', () => {
    testTradeLineItems(TEST_TRADE_FEE_ON_BUY)
  })
  it('fee on sell', () => {
    testTradeLineItems(TEST_TRADE_FEE_ON_SELL)
  })
  it('exact input api', () => {
    testTradeLineItems(TEST_TRADE_EXACT_INPUT_API)
  })
  it('dutch order eth input', () => {
    testTradeLineItems(TEST_DUTCH_TRADE_ETH_INPUT)
  })
  it('dutch v2 order eth input', () => {
    testTradeLineItems(TEST_DUTCH_V2_TRADE_ETH_INPUT)
  })
  it('syncing', () => {
    testTradeLineItems(TEST_TRADE_EXACT_INPUT, { syncing: true })
  })
  it('preview exact in', () => {
    testTradeLineItems(PREVIEW_EXACT_IN_TRADE)
  })
  it('Expiry', () => {
    render(
      <SwapLineItem
        key={SwapLineItemType.EXPIRY}
        trade={LIMIT_ORDER_TRADE}
        type={SwapLineItemType.EXPIRY}
        syncing={false}
      />,
    )
    // TODO: mock Date Time so we can use a snapshot test here
    expect(screen.getByText('Expiry')).toBeInTheDocument()
  })
})
