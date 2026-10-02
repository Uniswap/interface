import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { buildPartialCurrencyInfo } from 'uniswap/src/constants/routing'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDTokenUpdater } from '~/hooks/useUSDTokenUpdater'
import { useCurrencyBalance } from '~/lib/hooks/useCurrencyBalance'
import { BuyFormContextProvider, useBuyFormContext } from '~/pages/Swap/Buy/BuyFormContext'
import { act, render } from '~/test-utils/render'

vi.mock('uniswap/src/features/fiatOnRamp/hooks/useFiatOnRampQueries', () => ({
  useFiatOnRampAggregatorCountryListQuery: () => ({ data: undefined }),
  useFiatOnRampAggregatorCryptoQuoteQuery: () => ({ data: undefined, isFetching: false, error: undefined }),
}))
vi.mock('~/pages/Swap/Buy/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/pages/Swap/Buy/hooks')>()
  return {
    ...actual,
    useFiatOnRampSupportedTokens: () => [],
    useMeldFiatCurrencyInfo: () => ({
      meldSupportedFiatCurrency: actual.fallbackCurrencyInfo,
      notAvailableInThisRegion: false,
    }),
  }
})
vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: () => '0x0000000000000000000000000000000000000abc',
}))
vi.mock('uniswap/src/features/fiatCurrency/useLocalFiatToUSDConverter', () => ({
  useLocalFiatToUSDConverter: () => (fiatAmount: number) => fiatAmount,
}))
vi.mock('~/hooks/useUSDTokenUpdater', () => ({
  useUSDTokenUpdater: vi.fn(() => ({ formattedAmount: undefined, loading: false })),
}))
vi.mock('~/lib/hooks/useCurrencyBalance', () => ({
  useCurrencyBalance: vi.fn(() => undefined),
}))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: vi.fn(),
}))

const mockedUseCurrencyInfo = vi.mocked(useCurrencyInfo)
const mockedUseUSDTokenUpdater = vi.mocked(useUSDTokenUpdater)
const mockedUseCurrencyBalance = vi.mocked(useCurrencyBalance)

const BNB_USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'
// What the FOR token list hands over for BNB USDT when it is built from a v2 multichain token: the
// parent's 6 decimals applied to the BNB deployment. Single-chain GetToken returns the real 18.
const MULTICHAIN_BNB_USDT = new Token(UniverseChainId.Bnb, BNB_USDT_ADDRESS, 6, 'USDT', 'Tether USD')
const GET_TOKEN_BNB_USDT = new Token(UniverseChainId.Bnb, BNB_USDT_ADDRESS, 18, 'USDT', 'Tether USD')
const FOR_BNB_USDT = { currencyInfo: buildPartialCurrencyInfo(MULTICHAIN_BNB_USDT), meldCurrencyCode: 'USDT_BSC' }

let latestContext: ReturnType<typeof useBuyFormContext> | undefined

function ContextProbe() {
  latestContext = useBuyFormContext()
  return null
}

function renderOffRampForm() {
  return render(
    <BuyFormContextProvider rampDirection={RampDirection.OFF_RAMP}>
      <ContextProbe />
    </BuyFormContextProvider>,
  )
}

function selectForToken(): void {
  act(() => latestContext?.setBuyFormState((prev) => ({ ...prev, quoteCurrency: FOR_BNB_USDT })))
}

describe('BuyFormContextProvider quote currency resolution', () => {
  beforeEach(() => {
    latestContext = undefined
    mockedUseCurrencyInfo.mockReset()
    mockedUseUSDTokenUpdater.mockClear()
    mockedUseCurrencyBalance.mockClear()
  })

  it('converts and checks the balance with the per-chain currency, not the decimals the FOR list handed over', () => {
    mockedUseCurrencyInfo.mockImplementation((id) =>
      id === `56-${BNB_USDT_ADDRESS}` ? ({ currency: GET_TOKEN_BNB_USDT } as CurrencyInfo) : undefined,
    )
    renderOffRampForm()

    selectForToken()

    expect(mockedUseCurrencyInfo).toHaveBeenCalledWith(`56-${BNB_USDT_ADDRESS}`)
    expect(mockedUseUSDTokenUpdater.mock.calls.at(-1)?.[0].exactCurrency?.decimals).toBe(18)
    expect(mockedUseCurrencyBalance.mock.calls.at(-1)?.[1]?.decimals).toBe(18)
  })

  it('withholds the conversion and the balance while the per-chain currency is still resolving', () => {
    mockedUseCurrencyInfo.mockReturnValue(undefined)
    renderOffRampForm()

    selectForToken()

    expect(latestContext?.buyFormState.quoteCurrency).toBe(FOR_BNB_USDT)
    expect(mockedUseUSDTokenUpdater.mock.calls.at(-1)?.[0].exactCurrency).toBeUndefined()
    expect(mockedUseCurrencyBalance.mock.calls.at(-1)?.[1]).toBeUndefined()
    expect(latestContext?.derivedBuyFormInfo.amountOut).toBeUndefined()
  })
})
