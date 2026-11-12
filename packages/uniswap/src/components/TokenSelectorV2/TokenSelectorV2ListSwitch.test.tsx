import { TestID } from '@universe/test'
import { Text } from 'react-native'
import { OnchainItemListOptionType, type TokenOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { MY_TOKENS_CHIP_ID } from 'uniswap/src/components/TokenSelector/categoryFilters/categoryFilterChips'
import { TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { TokenSelectorV2ListSwitch } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2ListSwitch'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { currencyInfo } from 'uniswap/src/test/fixtures/wallet/currencies'
import { act, fireEvent, render } from 'uniswap/src/test/test-utils'

const { mockIsTokenCategoriesEnabled, mockUsePortfolioTokenOptions } = vi.hoisted(() => ({
  mockIsTokenCategoriesEnabled: vi.fn(),
  mockUsePortfolioTokenOptions: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: () => mockIsTokenCategoriesEnabled(),
  useDynamicConfigValue: ({ defaultValue }: { defaultValue: unknown }) => defaultValue,
}))
vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories', () => ({
  useAllTokenCategories: () => ({
    categories: [
      tokenCategory({ id: 'stablecoins', name: 'Stablecoins' }),
      tokenCategory({ id: 'memes', name: 'Memes' }),
    ],
    isLoading: false,
  }),
}))
vi.mock('uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions', () => ({
  usePortfolioTokenOptions: mockUsePortfolioTokenOptions,
}))
vi.mock('uniswap/src/components/TokenSelectorV2/TokenSelectorV2List', () => ({
  TokenSelectorV2List: ({ sections }: { sections?: OnchainItemSection<TokenOption>[] }) => (
    <>
      {sections?.map((section) => section.sectionHeader)}
      <Text>{sections?.flatMap((section) => section.data.map((row) => row.currencyInfo.currencyId)).join(',')}</Text>
    </>
  ),
}))
vi.mock('uniswap/src/components/TokenSelectorV2/lists/SwapListV2', () => ({
  SwapListV2: () => <Text testID="swap-list" />,
}))

function balance(currencyId: string, categoryIds: string[]): TokenOption {
  return {
    type: OnchainItemListOptionType.Token,
    currencyInfo: currencyInfo({ currencyId, categoryIds }),
    quantity: 1,
    balanceUSD: 1,
  }
}

function renderSwitch(variation: TokenSelectorVariation): ReturnType<typeof render> {
  return render(
    <TokenSelectorV2ListSwitch
      addresses={{ evmAddress: '0x0000000000000000000000000000000000000001', svmAddress: undefined }}
      chainFilter={null}
      chainIds={[]}
      debouncedParsedSearchFilter={null}
      debouncedSearchFilter={null}
      includeYourTokens={false}
      input={undefined}
      isTestnetModeEnabled={false}
      output={undefined}
      parsedChainFilter={null}
      portfolioData={{ data: undefined, isLoading: false, error: null, refetch: vi.fn() }}
      renderedInModal={false}
      searchFilter={null}
      searchInFocus={false}
      variation={variation}
      onSelectCurrency={vi.fn()}
      onSendEmptyActionPress={vi.fn()}
    />,
  )
}

describe('TokenSelectorV2ListSwitch category chips with no search query', () => {
  beforeEach(() => {
    mockIsTokenCategoriesEnabled.mockReturnValue(true)
    mockUsePortfolioTokenOptions.mockReturnValue({
      data: [balance('usdc', ['stablecoins']), balance('pepe', ['memes']), balance('eth', [])],
      hiddenTokens: undefined,
      error: undefined,
      refetch: vi.fn(),
      isLoading: false,
    })
  })

  it('shows Send chips derived from the balances, without "My tokens", and filters the list on selection', () => {
    const { getByTestId, getByText, queryByTestId } = renderSwitch(TokenSelectorVariation.BalancesOnly)

    expect(getByTestId(TestID.TokenSelectorCategoryFilterChipRow)).toBeTruthy()
    expect(getByTestId(`${TestID.TokenSelectorCategoryFilterChipPrefix}stablecoins`)).toBeTruthy()
    expect(getByTestId(`${TestID.TokenSelectorCategoryFilterChipPrefix}memes`)).toBeTruthy()
    expect(queryByTestId(`${TestID.TokenSelectorCategoryFilterChipPrefix}${MY_TOKENS_CHIP_ID}`)).toBeNull()
    expect(getByText('usdc,pepe,eth')).toBeTruthy()

    act(() => {
      fireEvent.press(getByTestId(`${TestID.TokenSelectorCategoryFilterChipPrefix}memes`))
    })
    expect(getByText('pepe')).toBeTruthy()
  })

  it('shows no chip row in Send when the token categories flag is off', () => {
    mockIsTokenCategoriesEnabled.mockReturnValue(false)
    const { getByText, queryByTestId } = renderSwitch(TokenSelectorVariation.BalancesOnly)

    expect(queryByTestId(TestID.TokenSelectorCategoryFilterChipRow)).toBeNull()
    expect(getByText('usdc,pepe,eth')).toBeTruthy()
  })

  it('shows no chip row in Send when no balance has a category', () => {
    mockUsePortfolioTokenOptions.mockReturnValue({
      data: [balance('eth', [])],
      hiddenTokens: undefined,
      error: undefined,
      refetch: vi.fn(),
      isLoading: false,
    })
    const { queryByTestId } = renderSwitch(TokenSelectorVariation.BalancesOnly)

    expect(queryByTestId(TestID.TokenSelectorCategoryFilterChipRow)).toBeNull()
  })

  it('derives no Send chip from a category held only by hidden balances, even when they are expanded', () => {
    mockUsePortfolioTokenOptions.mockReturnValue({
      data: [balance('usdc', ['stablecoins'])],
      hiddenTokens: [balance('spam', ['memes'])],
      error: undefined,
      refetch: vi.fn(),
      isLoading: false,
    })
    const { getByTestId, getByText, queryByTestId } = renderSwitch(TokenSelectorVariation.BalancesOnly)

    act(() => {
      fireEvent.press(getByText('hidden.tokens.info.text.button'))
    })
    expect(getByText('usdc,spam')).toBeTruthy()
    expect(getByTestId(`${TestID.TokenSelectorCategoryFilterChipPrefix}stablecoins`)).toBeTruthy()
    expect(queryByTestId(`${TestID.TokenSelectorCategoryFilterChipPrefix}memes`)).toBeNull()
  })

  it.each([TokenSelectorVariation.SwapInput, TokenSelectorVariation.SwapOutput])(
    'shows no chip row in the %s empty view',
    (variation) => {
      const { getByTestId, queryByTestId } = renderSwitch(variation)

      expect(getByTestId('swap-list')).toBeTruthy()
      expect(queryByTestId(TestID.TokenSelectorCategoryFilterChipRow)).toBeNull()
    },
  )
})
