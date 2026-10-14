import { UniverseChainId } from '@universe/chains'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { sendTokenSelectedAnalytics } from 'uniswap/src/components/TokenSelector/analytics/sendTokenSelectedAnalytics'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { ModalName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyField } from 'uniswap/src/types/currency'
import type { Mock } from 'vitest'

vi.mock('uniswap/src/features/telemetry/send')

const mockSendAnalyticsEvent = sendAnalyticsEvent as Mock

beforeEach(() => {
  mockSendAnalyticsEvent.mockClear()
})

describe('sendTokenSelectedAnalytics', () => {
  it('emits the Stocks-shelf payload', () => {
    sendTokenSelectedAnalytics({
      name: 'Alphabet',
      address: '0xe92f673ca36c5e2efd2de7628f815f84807e803f',
      chainId: UniverseChainId.Bnb,
      flow: TokenSelectorFlow.Swap,
      page: 'swap-page',
      currencyField: CurrencyField.OUTPUT,
      sectionKey: OnchainItemSectionName.Stocks,
      position: 3,
      suggestionCount: 10,
      tokenCategory: 'stocks',
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(UniswapEventName.TokenSelected, {
      name: 'Alphabet',
      address: '0xe92f673ca36c5e2efd2de7628f815f84807e803f',
      chain: UniverseChainId.Bnb,
      modal: ModalName.Swap,
      page: 'swap-page',
      field: CurrencyField.OUTPUT,
      token_balance_usd: undefined,
      category: OnchainItemSectionName.Stocks,
      position: 3,
      suggestion_count: 10,
      query: undefined,
      tokenSection: OnchainItemSectionName.Stocks,
      preselect_asset: false,
      token_category: 'stocks',
    })
  })

  it('emits the vertical-row payload from the same shape, carrying query and balance', () => {
    sendTokenSelectedAnalytics({
      name: 'Test Token',
      address: '0x123',
      chainId: UniverseChainId.Mainnet,
      flow: TokenSelectorFlow.Send,
      page: undefined,
      currencyField: CurrencyField.INPUT,
      sectionKey: OnchainItemSectionName.TrendingTokens,
      position: 1,
      suggestionCount: 25,
      query: 'test',
      tokenBalanceUsd: 42.5,
      tokenCategory: 'stablecoins',
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(UniswapEventName.TokenSelected, {
      name: 'Test Token',
      address: '0x123',
      chain: UniverseChainId.Mainnet,
      modal: ModalName.Send,
      page: undefined,
      field: CurrencyField.INPUT,
      token_balance_usd: 42.5,
      category: OnchainItemSectionName.TrendingTokens,
      position: 1,
      suggestion_count: 25,
      query: 'test',
      tokenSection: OnchainItemSectionName.TrendingTokens,
      preselect_asset: false,
      token_category: 'stablecoins',
    })
  })

  it('reports no modal for a flow that has none, and omits the fields the caller left out', () => {
    sendTokenSelectedAnalytics({
      address: '0x123',
      chainId: UniverseChainId.Mainnet,
      flow: TokenSelectorFlow.Liquidity,
      currencyField: CurrencyField.INPUT,
      sectionKey: OnchainItemSectionName.YourTokens,
      tokenCategory: null,
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(UniswapEventName.TokenSelected, {
      name: undefined,
      address: '0x123',
      chain: UniverseChainId.Mainnet,
      modal: undefined,
      page: undefined,
      field: CurrencyField.INPUT,
      token_balance_usd: undefined,
      category: OnchainItemSectionName.YourTokens,
      position: undefined,
      suggestion_count: undefined,
      query: undefined,
      tokenSection: OnchainItemSectionName.YourTokens,
      // Always false: this emitter only serves user-driven selections.
      preselect_asset: false,
      token_category: null,
    })
  })
})
