import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { Text } from 'react-native'
import { OnchainItemListOptionType, type RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { StocksHorizontalRow } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StocksHorizontalRow.web'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TokenList, type CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos, useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/warnings/slice/hooks'
import { render } from 'uniswap/src/test/test-utils'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/tokens/useCurrencyInfo')>()),
  useCurrencyInfoWithLoading: vi.fn(),
  useCurrencyInfos: vi.fn(),
}))

vi.mock('uniswap/src/features/tokens/warnings/slice/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/tokens/warnings/slice/hooks')>()),
  useDismissedTokenWarnings: vi.fn(),
}))

// The real TokenWarningModal renders inside a native bottom sheet that isn't visible in this test env; stub it to a
// flat surface so we can assert the section-level host wires it up (its copy is covered by safetyUtils tests).
// Mirrors the real modal's blocked routing: for a Blocked token the acknowledge button closes without acknowledging.
vi.mock('uniswap/src/features/tokens/warnings/TokenWarningModal', () => ({
  default: function MockTokenWarningModal({
    currencyInfo0,
    isVisible,
    onAcknowledge,
    closeModalOnly,
  }: {
    currencyInfo0: CurrencyInfo
    isVisible: boolean
    onAcknowledge: () => void
    closeModalOnly: () => void
  }): JSX.Element | null {
    if (!isVisible) {
      return null
    }
    const isBlocked = getTokenWarningSeverity(currencyInfo0) === WarningSeverity.Blocked
    return (
      <>
        <Text testID="warning-modal-title">Always do your research</Text>
        <Text testID="warning-modal-continue" onPress={isBlocked ? closeModalOnly : onAcknowledge}>
          Continue
        </Text>
        <Text testID="warning-modal-goback" onPress={closeModalOnly}>
          Go back
        </Text>
      </>
    )
  },
}))

const mockUseCurrencyInfoWithLoading = vi.mocked(useCurrencyInfoWithLoading)
const mockUseCurrencyInfos = vi.mocked(useCurrencyInfos)
const mockUseDismissedTokenWarnings = vi.mocked(useDismissedTokenWarnings)

function makeStock(symbol: string): RwaTokenOption {
  return {
    type: OnchainItemListOptionType.Rwa,
    chainId: UniverseChainId.Bnb,
    address: `0x${symbol}`,
    symbol,
    name: `${symbol} name`,
  }
}

const warnableStock: RwaTokenOption = {
  type: OnchainItemListOptionType.Rwa,
  chainId: UniverseChainId.Bnb,
  address: '0xe92f673ca36c5e2efd2de7628f815f84807e803f',
  symbol: 'GOOGLX',
  name: 'Alphabet',
}

// A fetched CurrencyInfo for warnableStock, as the token query would return it.
function makeFetchedCurrencyInfo(tokenList: TokenList): CurrencyInfo {
  return {
    currency: new Token(warnableStock.chainId, warnableStock.address, 18, warnableStock.symbol, warnableStock.name),
    currencyId: `${warnableStock.chainId}-${warnableStock.address}`,
    logoUrl: null,
    safetyInfo: { tokenList, protectionResult: GraphQLApi.ProtectionResult.Benign },
  }
}

const sevenTokens: RwaTokenOption[] = ['AAPLX', 'GOOGLX', 'MSFTX', 'AMZNX', 'TSLAX', 'METAX', 'NVDAX'].map(makeStock)
const threeTokens: RwaTokenOption[] = ['AAPLX', 'GOOGLX', 'MSFTX'].map(makeStock)

function testIdFor(token: RwaTokenOption): string {
  return `stock-option-${token.chainId}-${token.symbol}`
}

beforeEach(() => {
  mockUseCurrencyInfoWithLoading.mockReturnValue({ currencyInfo: undefined, loading: false })
  mockUseCurrencyInfos.mockReturnValue([])
  mockUseDismissedTokenWarnings.mockReturnValue({ tokenWarningDismissed: false, onDismissTokenWarning: vi.fn() })
})

describe('StocksHorizontalRow.web', () => {
  it('collapsed: shows 4 tiles + a 3+ expand control and fires onExpand with all tokens', () => {
    const onExpand = vi.fn()
    const { getByTestId, getByText, queryByTestId } = render(
      <StocksHorizontalRow
        tokens={sevenTokens}
        expanded={false}
        showTokenWarnings={true}
        onSelectRwaToken={vi.fn()}
        onExpand={onExpand}
      />,
    )

    // First 4 tiles are visible
    sevenTokens.slice(0, 4).forEach((token) => {
      expect(getByTestId(testIdFor(token))).toBeDefined()
    })
    // The remaining tiles are not yet rendered
    sevenTokens.slice(4).forEach((token) => {
      expect(queryByTestId(testIdFor(token))).toBeNull()
    })

    const expandControl = getByText('3+')
    expect(expandControl).toBeDefined()

    fireEvent.press(expandControl)
    expect(onExpand).toHaveBeenCalledWith(sevenTokens)
  })

  it('expanded: shows all 7 tiles and no expand control', () => {
    const { getByTestId, queryByText } = render(
      <StocksHorizontalRow
        tokens={sevenTokens}
        expanded={true}
        showTokenWarnings={true}
        onSelectRwaToken={vi.fn()}
        onExpand={vi.fn()}
      />,
    )

    sevenTokens.forEach((token) => {
      expect(getByTestId(testIdFor(token))).toBeDefined()
    })
    expect(queryByText('3+')).toBeNull()
    expect(queryByText('+')).toBeNull()
  })

  it('with <= 5 tokens: renders all tiles and no expand control', () => {
    const { getByTestId, queryByText } = render(
      <StocksHorizontalRow
        tokens={threeTokens}
        expanded={false}
        showTokenWarnings={true}
        onSelectRwaToken={vi.fn()}
        onExpand={vi.fn()}
      />,
    )

    threeTokens.forEach((token) => {
      expect(getByTestId(testIdFor(token))).toBeDefined()
    })
    expect(queryByText('+')).toBeNull()
  })

  it('tapping a stock shows the warning modal without selecting', async () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue({
      currencyInfo: makeFetchedCurrencyInfo(TokenList.NonDefault),
      loading: false,
    })
    const onSelect = vi.fn()
    const { getByTestId, findByTestId } = render(
      <StocksHorizontalRow
        tokens={[warnableStock]}
        expanded={true}
        showTokenWarnings={true}
        onSelectRwaToken={onSelect}
        onExpand={vi.fn()}
      />,
    )

    fireEvent.press(getByTestId(testIdFor(warnableStock)))

    expect(await findByTestId('warning-modal-title')).toBeDefined()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('acknowledging the warning selects the token', async () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue({
      currencyInfo: makeFetchedCurrencyInfo(TokenList.NonDefault),
      loading: false,
    })
    const onSelect = vi.fn()
    const { getByTestId, findByTestId } = render(
      <StocksHorizontalRow
        tokens={[warnableStock]}
        expanded={true}
        showTokenWarnings={true}
        onSelectRwaToken={onSelect}
        onExpand={vi.fn()}
      />,
    )

    fireEvent.press(getByTestId(testIdFor(warnableStock)))
    fireEvent.press(await findByTestId('warning-modal-continue'))

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(warnableStock))
  })

  it('"Go back" cancels without selecting', async () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue({
      currencyInfo: makeFetchedCurrencyInfo(TokenList.NonDefault),
      loading: false,
    })
    const onSelect = vi.fn()
    const { getByTestId, findByTestId, queryByTestId } = render(
      <StocksHorizontalRow
        tokens={[warnableStock]}
        expanded={true}
        showTokenWarnings={true}
        onSelectRwaToken={onSelect}
        onExpand={vi.fn()}
      />,
    )

    fireEvent.press(getByTestId(testIdFor(warnableStock)))
    fireEvent.press(await findByTestId('warning-modal-goback'))

    await waitFor(() => expect(queryByTestId('warning-modal-title')).toBeNull())
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('a previously-dismissed warning selects directly without a modal', async () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue({
      currencyInfo: makeFetchedCurrencyInfo(TokenList.NonDefault),
      loading: false,
    })
    mockUseDismissedTokenWarnings.mockReturnValue({ tokenWarningDismissed: true, onDismissTokenWarning: vi.fn() })
    const onSelect = vi.fn()
    const { getByTestId, queryByTestId } = render(
      <StocksHorizontalRow
        tokens={[warnableStock]}
        expanded={true}
        showTokenWarnings={true}
        onSelectRwaToken={onSelect}
        onExpand={vi.fn()}
      />,
    )

    fireEvent.press(getByTestId(testIdFor(warnableStock)))

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(warnableStock))
    expect(queryByTestId('warning-modal-title')).toBeNull()
  })

  it('with warnings gated off, taps select immediately without a modal', () => {
    const onSelect = vi.fn()
    const { getByTestId, queryByTestId } = render(
      <StocksHorizontalRow
        tokens={[warnableStock]}
        expanded={true}
        showTokenWarnings={false}
        onSelectRwaToken={onSelect}
        onExpand={vi.fn()}
      />,
    )

    fireEvent.press(getByTestId(testIdFor(warnableStock)))

    expect(onSelect).toHaveBeenCalledWith(warnableStock)
    expect(queryByTestId('warning-modal-title')).toBeNull()
  })

  it('while the token query is loading, no modal shows and nothing is selected', () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue({ currencyInfo: undefined, loading: true })
    const onSelect = vi.fn()
    const { getByTestId, queryByTestId } = render(
      <StocksHorizontalRow
        tokens={[warnableStock]}
        expanded={true}
        showTokenWarnings={true}
        onSelectRwaToken={onSelect}
        onExpand={vi.fn()}
      />,
    )

    fireEvent.press(getByTestId(testIdFor(warnableStock)))

    expect(queryByTestId('warning-modal-title')).toBeNull()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('a blocked token shows the modal and never selects, even via the acknowledge button', async () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue({
      currencyInfo: makeFetchedCurrencyInfo(TokenList.Blocked),
      loading: false,
    })
    const onSelect = vi.fn()
    const { getByTestId, findByTestId, queryByTestId } = render(
      <StocksHorizontalRow
        tokens={[warnableStock]}
        expanded={true}
        showTokenWarnings={true}
        onSelectRwaToken={onSelect}
        onExpand={vi.fn()}
      />,
    )

    fireEvent.press(getByTestId(testIdFor(warnableStock)))
    // The real modal routes the acknowledge button to close for blocked tokens (mirrored by the mock).
    fireEvent.press(await findByTestId('warning-modal-continue'))

    await waitFor(() => expect(queryByTestId('warning-modal-title')).toBeNull())
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('a fetched default-list token with no warning selects directly without a modal', async () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue({
      currencyInfo: makeFetchedCurrencyInfo(TokenList.Default),
      loading: false,
    })
    const onSelect = vi.fn()
    const { getByTestId, queryByTestId } = render(
      <StocksHorizontalRow
        tokens={[warnableStock]}
        expanded={true}
        showTokenWarnings={true}
        onSelectRwaToken={onSelect}
        onExpand={vi.fn()}
      />,
    )

    fireEvent.press(getByTestId(testIdFor(warnableStock)))

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(warnableStock))
    expect(queryByTestId('warning-modal-title')).toBeNull()
  })

  it('prefetches token info for all stocks with one batched query, including tiles behind the expand control', () => {
    render(
      <StocksHorizontalRow
        tokens={sevenTokens}
        expanded={false}
        showTokenWarnings={true}
        onSelectRwaToken={vi.fn()}
        onExpand={vi.fn()}
      />,
    )

    expect(mockUseCurrencyInfos).toHaveBeenCalledWith(
      sevenTokens.map((token) => buildCurrencyId(token.chainId, token.address)),
      { skip: false },
    )
  })

  it('skips the batched prefetch when warnings are gated off', () => {
    render(
      <StocksHorizontalRow
        tokens={sevenTokens}
        expanded={false}
        showTokenWarnings={false}
        onSelectRwaToken={vi.fn()}
        onExpand={vi.fn()}
      />,
    )

    expect(mockUseCurrencyInfos).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('a hung token query selects directly without a modal after the timeout', () => {
    vi.useFakeTimers()
    try {
      mockUseCurrencyInfoWithLoading.mockReturnValue({ currencyInfo: undefined, loading: true })
      const onSelect = vi.fn()
      const { getByTestId, queryByTestId } = render(
        <StocksHorizontalRow
          tokens={[warnableStock]}
          expanded={true}
          showTokenWarnings={true}
          onSelectRwaToken={onSelect}
          onExpand={vi.fn()}
        />,
      )

      fireEvent.press(getByTestId(testIdFor(warnableStock)))
      expect(queryByTestId('warning-modal-title')).toBeNull()
      expect(onSelect).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(3_000)
      })

      expect(onSelect).toHaveBeenCalledWith(warnableStock)
      expect(queryByTestId('warning-modal-title')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('a query that resolves with no token info selects directly without a modal', async () => {
    // beforeEach default: currencyInfo undefined, loading false — i.e. the fetch came back empty.
    const onSelect = vi.fn()
    const { getByTestId, queryByTestId } = render(
      <StocksHorizontalRow
        tokens={[warnableStock]}
        expanded={true}
        showTokenWarnings={true}
        onSelectRwaToken={onSelect}
        onExpand={vi.fn()}
      />,
    )

    fireEvent.press(getByTestId(testIdFor(warnableStock)))

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(warnableStock))
    expect(queryByTestId('warning-modal-title')).toBeNull()
  })
})
