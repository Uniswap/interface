import type { UseQueryResult } from '@tanstack/react-query'
import { fireEvent, waitFor } from '@testing-library/react-native'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { Fragment } from 'react'
import { Text } from 'react-native'
import { OnchainItemListOptionType, type RwaTokenOption } from 'uniswap/src/components/lists/items/types'
import { StocksHorizontalRow } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StocksHorizontalRow.native'
import { ProtectionResult } from 'uniswap/src/features/dataApi/safety'
import { TokenList, type CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos, useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/warnings/slice/hooks'
import { render } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/tokens/useCurrencyInfo')>()),
  useCurrencyInfoWithLoading: vi.fn(),
  useCurrencyInfos: vi.fn(),
}))

vi.mock('uniswap/src/features/tokens/warnings/slice/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/tokens/warnings/slice/hooks')>()),
  useDismissedTokenWarnings: vi.fn(),
}))

// The gesture-handler FlatList doesn't lay out in this jsdom env; flatten the row so the pills render.
vi.mock('uniswap/src/components/TokenSelector/lists/HorizontalPillRow.native', () => ({
  HorizontalPillRow: function MockHorizontalPillRow<T>({
    data,
    keyExtractor,
    renderPill,
  }: {
    data: T[]
    keyExtractor: (item: T) => string
    renderPill: (item: T) => JSX.Element
  }): JSX.Element {
    return (
      <>
        {data.map((item) => (
          <Fragment key={keyExtractor(item)}>{renderPill(item)}</Fragment>
        ))}
      </>
    )
  },
}))

// Same flat stub as the web test; the section-level wiring is what's under test.
vi.mock('uniswap/src/features/tokens/warnings/TokenWarningModal', () => ({
  default: function MockTokenWarningModal({
    isVisible,
    onAcknowledge,
    closeModalOnly,
  }: {
    isVisible: boolean
    onAcknowledge: () => void
    closeModalOnly: () => void
  }): JSX.Element | null {
    if (!isVisible) {
      return null
    }
    return (
      <>
        <Text testID="warning-modal-title">Always do your research</Text>
        <Text testID="warning-modal-continue" onPress={onAcknowledge}>
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

const warnableStock: RwaTokenOption = {
  type: OnchainItemListOptionType.Rwa,
  chainId: UniverseChainId.Bnb,
  address: '0xe92f673ca36c5e2efd2de7628f815f84807e803f',
  symbol: 'GOOGLX',
  name: 'Alphabet',
}

// A fetched off-token-list (NonDefault) CurrencyInfo for warnableStock, which gates as Low severity.
const warnableCurrencyInfo: CurrencyInfo = {
  currency: new Token(warnableStock.chainId, warnableStock.address, 18, warnableStock.symbol, warnableStock.name),
  currencyId: `${warnableStock.chainId}-${warnableStock.address}`,
  logoUrl: null,
  safetyInfo: { tokenList: TokenList.NonDefault, protectionResult: ProtectionResult.Benign },
}

// Only `data`/`isLoading` are read by the component; the rest of the query result is irrelevant here.
function mockQueryResult(data: Maybe<CurrencyInfo>, isLoading = false): UseQueryResult<Maybe<CurrencyInfo>> {
  return { data, isLoading } as UseQueryResult<Maybe<CurrencyInfo>>
}

const stockTestId = `stock-option-${warnableStock.chainId}-${warnableStock.symbol}`

beforeEach(() => {
  mockUseCurrencyInfoWithLoading.mockReturnValue(mockQueryResult(undefined))
  mockUseCurrencyInfos.mockReturnValue([])
  mockUseDismissedTokenWarnings.mockReturnValue({ tokenWarningDismissed: false, onDismissTokenWarning: vi.fn() })
})

describe('StocksHorizontalRow.native', () => {
  it('prefetches token info for the stocks with one batched query', () => {
    render(<StocksHorizontalRow tokens={[warnableStock]} showTokenWarnings={true} onSelectRwaToken={vi.fn()} />)

    expect(mockUseCurrencyInfos).toHaveBeenCalledWith([`${warnableStock.chainId}-${warnableStock.address}`], {
      skip: false,
    })
  })

  it('a tap resolves from the batched prefetch without a per-tap query', async () => {
    mockUseCurrencyInfos.mockReturnValue([warnableCurrencyInfo])
    const onSelect = vi.fn()
    const { getByTestId, findByTestId } = render(
      <StocksHorizontalRow tokens={[warnableStock]} showTokenWarnings={true} onSelectRwaToken={onSelect} />,
    )

    fireEvent.press(getByTestId(stockTestId))

    expect(await findByTestId('warning-modal-title')).toBeDefined()
    expect(onSelect).not.toHaveBeenCalled()
    // The per-tap query stays skipped (undefined currencyId) because the batch already had this token.
    expect(mockUseCurrencyInfoWithLoading).not.toHaveBeenCalledWith(expect.any(String))
  })

  it('tapping a pill shows the warning modal without selecting', async () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue(mockQueryResult(warnableCurrencyInfo))
    const onSelect = vi.fn()
    const { getByTestId, findByTestId } = render(
      <StocksHorizontalRow tokens={[warnableStock]} showTokenWarnings={true} onSelectRwaToken={onSelect} />,
    )

    fireEvent.press(getByTestId(stockTestId))

    expect(await findByTestId('warning-modal-title')).toBeDefined()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('acknowledging the warning selects the token', async () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue(mockQueryResult(warnableCurrencyInfo))
    const onSelect = vi.fn()
    const { getByTestId, findByTestId } = render(
      <StocksHorizontalRow tokens={[warnableStock]} showTokenWarnings={true} onSelectRwaToken={onSelect} />,
    )

    fireEvent.press(getByTestId(stockTestId))
    fireEvent.press(await findByTestId('warning-modal-continue'))

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(warnableStock))
  })

  it('"Go back" cancels without selecting', async () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue(mockQueryResult(warnableCurrencyInfo))
    const onSelect = vi.fn()
    const { getByTestId, findByTestId, queryByTestId } = render(
      <StocksHorizontalRow tokens={[warnableStock]} showTokenWarnings={true} onSelectRwaToken={onSelect} />,
    )

    fireEvent.press(getByTestId(stockTestId))
    fireEvent.press(await findByTestId('warning-modal-goback'))

    await waitFor(() => expect(queryByTestId('warning-modal-title')).toBeNull())
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('a query that resolves with no token info selects directly without a modal', async () => {
    // beforeEach default: currencyInfo undefined, loading false — i.e. the fetch came back empty.
    const onSelect = vi.fn()
    const { getByTestId, queryByTestId } = render(
      <StocksHorizontalRow tokens={[warnableStock]} showTokenWarnings={true} onSelectRwaToken={onSelect} />,
    )

    fireEvent.press(getByTestId(stockTestId))

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(warnableStock))
    expect(queryByTestId('warning-modal-title')).toBeNull()
  })
})
