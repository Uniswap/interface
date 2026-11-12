import { TradingApi } from '@universe/api'
import { isAllBridgeProviders } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/BridgingOptions/isAllBridgeProviders'

const { ACROSS, RELAY } = TradingApi.BridgeProvider

describe(isAllBridgeProviders, () => {
  it.each([
    { selected: [ACROSS, RELAY], expected: true },
    { selected: [RELAY, ACROSS], expected: true },
    { selected: [ACROSS], expected: false },
    { selected: [RELAY], expected: false },
    { selected: [], expected: false },
  ])('$selected → $expected', ({ selected, expected }) => {
    expect(isAllBridgeProviders(selected)).toBe(expected)
  })
})
