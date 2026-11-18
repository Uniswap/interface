import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import type { ReviewSummaryProps } from '@universe/transactions-ui'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TransactionAmountsReview } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/TransactionAmountsReview'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { currencyInfo } from 'uniswap/src/test/fixtures'
import { render } from 'uniswap/src/test/test-utils'
import { CurrencyField } from 'uniswap/src/types/currency'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'

const mocks = vi.hoisted(() => ({
  getTradeAmounts: vi.fn(),
  currencyInfos: new Map<string, unknown>(),
  reviewSummary: vi.fn((_props: unknown): null => null),
}))

// Rendering lives in ReviewSummary and is tested there; this checks what the adapter hands it.
vi.mock('@universe/transactions-ui', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ReviewSummary: mocks.reviewSummary,
}))

vi.mock('uniswap/src/features/transactions/swap/utils/getTradeAmounts', () => ({
  getTradeAmounts: mocks.getTradeAmounts,
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: (id: string | undefined): unknown => (id ? mocks.currencyInfos.get(id) : undefined),
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCValue: (): null => null,
}))

const INPUT_TOKEN = new Token(UniverseChainId.Mainnet, '0x0000000000000000000000000000000000000001', 18, 'ETH')
// pathUSD is the token from the bug report; 7 chars was enough to trip the old 6-char cutoff.
const PATH_USD = new Token(UniverseChainId.Mainnet, '0x0000000000000000000000000000000000000002', 6, 'pathUSD')
const LONG_SYMBOL = 'VERYLONGTOKENSYMBOLFORTESTS'
const LONG_SYMBOL_TOKEN = new Token(
  UniverseChainId.Mainnet,
  '0x0000000000000000000000000000000000000003',
  18,
  LONG_SYMBOL,
)
const NO_SYMBOL_TOKEN = new Token(UniverseChainId.Mainnet, '0x0000000000000000000000000000000000000004', 18)

function renderedProps(outputToken: Token): ReviewSummaryProps {
  for (const token of [INPUT_TOKEN, outputToken]) {
    mocks.currencyInfos.set(
      buildCurrencyId(token.chainId, currencyAddress(token)),
      currencyInfo({ nativeCurrency: token }),
    )
  }
  mocks.getTradeAmounts.mockReturnValue({
    inputCurrencyAmount: CurrencyAmount.fromRawAmount(INPUT_TOKEN, '1000000000000000000'),
    outputCurrencyAmount: CurrencyAmount.fromRawAmount(outputToken, '1000000'),
  })
  const derivedSwapInfo = {
    exactCurrencyField: CurrencyField.INPUT,
    trade: { trade: null, indicativeTrade: undefined },
  } as unknown as DerivedSwapInfo<CurrencyInfo, CurrencyInfo>

  render(
    <TransactionAmountsReview
      acceptedDerivedSwapInfo={derivedSwapInfo}
      newTradeRequiresAcceptance={false}
      onClose={vi.fn()}
    />,
  )
  return mocks.reviewSummary.mock.lastCall?.[0] as ReviewSummaryProps
}

describe(TransactionAmountsReview, () => {
  afterEach(() => {
    mocks.currencyInfos.clear()
    vi.clearAllMocks()
  })

  it.each([
    ['a 7-character symbol', PATH_USD, 'pathUSD'],
    ['a very long symbol', LONG_SYMBOL_TOKEN, LONG_SYMBOL],
  ])('passes %s to ReviewSummary untruncated', (_, token, expected) => {
    const { input, output } = renderedProps(token)
    expect(input?.symbol).toBe('ETH')
    expect(output?.symbol).toBe(expected)
  })

  it('passes an empty symbol when the token has none', () => {
    expect(renderedProps(NO_SYMBOL_TOKEN).output?.symbol).toBe('')
  })
})
