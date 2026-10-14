import type { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import {
  OnchainItemListOptionType,
  type RwaTokenOption,
  type TokenSelectorOption,
} from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useTokenSelectionHandler } from 'uniswap/src/components/TokenSelector/hooks/useTokenSelectionHandler'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ModalName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { renderHook } from 'uniswap/src/test/test-utils'
import { CurrencyField } from 'uniswap/src/types/currency'
import type { Mock } from 'vitest'

vi.mock('uniswap/src/features/telemetry/send')

const mockSendAnalyticsEvent = sendAnalyticsEvent as Mock

const TOKEN_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
const STOCK_ADDRESS = '0xe92f673ca36c5e2efd2de7628f815f84807e803f'

const tokenCurrencyInfo = {
  currency: {
    chainId: UniverseChainId.Mainnet,
    address: TOKEN_ADDRESS,
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimals: 8,
    isNative: false,
    isToken: true,
  } as Token,
  currencyId: `${UniverseChainId.Mainnet}-${TOKEN_ADDRESS}`,
  logoUrl: null,
} as CurrencyInfo

const verticalSection: OnchainItemSection<TokenSelectorOption> = {
  sectionKey: OnchainItemSectionName.TrendingTokens,
  data: [
    { type: OnchainItemListOptionType.Token, currencyInfo: tokenCurrencyInfo, quantity: null, balanceUSD: 12.5 },
    { type: OnchainItemListOptionType.Token, currencyInfo: tokenCurrencyInfo, quantity: null, balanceUSD: null },
  ],
}

const stock: RwaTokenOption = {
  type: OnchainItemListOptionType.Rwa,
  chainId: UniverseChainId.Bnb,
  address: STOCK_ADDRESS,
  symbol: 'GOOGLX',
  name: 'Alphabet',
}

const SHELF_CONTEXT = { sectionKey: OnchainItemSectionName.Stocks, position: 2, suggestionCount: 10 }

function renderHandler({ onSelectRwaToken }: { onSelectRwaToken?: Mock } = {}): {
  onSelectCurrency: Mock
  handler: ReturnType<typeof useTokenSelectionHandler>
} {
  const onSelectCurrency = vi.fn()
  const { result } = renderHook(() =>
    useTokenSelectionHandler({
      flow: TokenSelectorFlow.Swap,
      currencyField: CurrencyField.OUTPUT,
      chainFilter: null,
      oppositeToken: undefined,
      debouncedSearchFilter: 'wbtc',
      onSelectCurrency,
      onSelectRwaToken,
    }),
  )
  return { onSelectCurrency, handler: result.current }
}

/** The properties of the single Token Selected call, or a failure if there wasn't exactly one. */
function tokenSelectedProperties(): Record<string, unknown> {
  const calls = mockSendAnalyticsEvent.mock.calls.filter(([name]) => name === UniswapEventName.TokenSelected)
  expect(calls).toHaveLength(1)
  return calls[0]?.[1] as Record<string, unknown>
}

beforeEach(() => {
  mockSendAnalyticsEvent.mockClear()
})

describe('useTokenSelectionHandler', () => {
  it('emits Token Selected for a vertical-row selection, then selects the currency', () => {
    const { onSelectCurrency, handler } = renderHandler()

    handler.onSelectCurrencyCallback(tokenCurrencyInfo, verticalSection, 0)

    expect(tokenSelectedProperties()).toEqual({
      name: 'Wrapped BTC',
      address: TOKEN_ADDRESS,
      chain: UniverseChainId.Mainnet,
      modal: ModalName.Swap,
      page: undefined,
      field: CurrencyField.OUTPUT,
      token_balance_usd: 12.5,
      category: OnchainItemSectionName.TrendingTokens,
      position: 1,
      suggestion_count: 2,
      query: 'wbtc',
      tokenSection: OnchainItemSectionName.TrendingTokens,
      preselect_asset: false,
      token_category: null,
    })
    // allowCrossChainPair is decided by chained-actions chain support, which this path doesn't influence.
    expect(onSelectCurrency).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: tokenCurrencyInfo.currency,
        field: CurrencyField.OUTPUT,
        isPreselectedAsset: false,
      }),
    )
  })

  it('emits Token Selected for a Stocks-shelf selection, then delegates to the RWA handler', () => {
    const onSelectRwaToken = vi.fn()
    const { handler } = renderHandler({ onSelectRwaToken })

    handler.onSelectRwaTokenCallback?.(stock, SHELF_CONTEXT)

    expect(tokenSelectedProperties()).toEqual({
      name: 'Alphabet',
      address: STOCK_ADDRESS,
      chain: UniverseChainId.Bnb,
      modal: ModalName.Swap,
      page: undefined,
      field: CurrencyField.OUTPUT,
      token_balance_usd: undefined,
      category: OnchainItemSectionName.Stocks,
      position: 2,
      suggestion_count: 10,
      // The shelf never renders alongside a search query, so it reports none.
      query: undefined,
      tokenSection: OnchainItemSectionName.Stocks,
      preselect_asset: false,
      token_category: null,
    })
    expect(onSelectRwaToken).toHaveBeenCalledWith(stock, SHELF_CONTEXT)
  })

  it('emits the same property shape from both paths', () => {
    const { handler } = renderHandler({ onSelectRwaToken: vi.fn() })

    handler.onSelectCurrencyCallback(tokenCurrencyInfo, verticalSection, 0)
    const verticalKeys = Object.keys(tokenSelectedProperties()).sort()

    mockSendAnalyticsEvent.mockClear()
    handler.onSelectRwaTokenCallback?.(stock, SHELF_CONTEXT)
    const shelfKeys = Object.keys(tokenSelectedProperties()).sort()

    expect(shelfKeys).toEqual(verticalKeys)
    // Guards the assertion itself: an empty payload would make the comparison above vacuous.
    expect(shelfKeys).toContain('tokenSection')
  })

  it('exposes no RWA callback when the caller wires no RWA handler', () => {
    const { handler } = renderHandler()

    expect(handler.onSelectRwaTokenCallback).toBeUndefined()
    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('reports the input-side element name for the input field', () => {
    const onSelectCurrency = vi.fn()
    const { result } = renderHook(() =>
      useTokenSelectionHandler({
        flow: TokenSelectorFlow.Swap,
        currencyField: CurrencyField.INPUT,
        chainFilter: null,
        oppositeToken: undefined,
        debouncedSearchFilter: null,
        onSelectCurrency,
      }),
    )

    expect(result.current.currencyFieldName).toBe('token-input-selector')
  })
})
