import { InterfaceTrade } from 'state/routing/types'
import {
  TEST_ALLOWED_SLIPPAGE,
  TEST_DUTCH_TRADE_ETH_INPUT,
  TEST_TRADE_EXACT_INPUT,
  TEST_TRADE_EXACT_INPUT_API,
  TEST_TRADE_EXACT_OUTPUT,
  TEST_TRADE_FEE_ON_BUY,
  TEST_TRADE_FEE_ON_SELL,
} from 'test-utils/constants'
import { render } from 'test-utils/render'

import SwapLineItem, { SwapLineItemTypes } from './SwapLineItem'

const AllLineItemsTypes = Object.keys(SwapLineItemTypes).map(Number).filter(Boolean)
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
    </>
  )
  expect(asFragment).toMatchSnapshot()
}

/* eslint-disable jest/expect-expect */ // allow expect inside testTradeLineItems
describe('SwapLineItem.tsx', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
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
  it('syncing', () => {
    testTradeLineItems(TEST_TRADE_EXACT_INPUT, { syncing: true })
  })
})
