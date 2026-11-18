import { UniverseChainId } from '@universe/chains'
import type { ReactNode } from 'react'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { BuyNativeTokenButton } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/BuyNativeTokenButton'
import { renderWithProviders } from 'uniswap/src/test/render'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const mockButton = vi.hoisted(() => vi.fn(({ children }: { children?: ReactNode }) => children))
const mockButtonText = vi.hoisted(() => vi.fn(({ children }: { children?: ReactNode }) => children))
vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  Button: Object.assign(mockButton, { Text: mockButtonText }),
}))

vi.mock('uniswap/src/features/fiatOnRamp/hooks', () => ({
  useIsSupportedFiatOnRampCurrency: (): { currency: object; isLoading: boolean } => ({
    currency: { meldCurrencyCode: 'ETH_ROBINHOOD' },
    isLoading: false,
  }),
}))

const chainId = UniverseChainId.Robinhood
const nativeCurrencyInfo = {
  currency: { chainId, symbol: 'ETH', name: 'Robinhood ETH', isNative: true },
  currencyId: buildCurrencyId(chainId, getNativeAddress(chainId)),
  logoUrl: undefined,
} as unknown as CurrencyInfo

function lastButtonProps(): { emphasis?: string; backgroundColor?: string } {
  return mockButton.mock.lastCall?.[0] as { emphasis?: string; backgroundColor?: string }
}

function lastButtonTextProps(): { color?: string } {
  return mockButtonText.mock.lastCall?.[0] as { color?: string }
}

describe(BuyNativeTokenButton, () => {
  beforeEach(() => {
    mockButton.mockClear()
    mockButtonText.mockClear()
  })

  it('tints the primary button with the network colors by default', () => {
    renderWithProviders(<BuyNativeTokenButton nativeCurrencyInfo={nativeCurrencyInfo} />)

    expect(lastButtonProps()).toMatchObject({ emphasis: 'primary', backgroundColor: expect.any(String) })
    expect(lastButtonTextProps().color).toEqual(expect.any(String))
  })

  it('keeps the neutral primary button when network colors are turned off', () => {
    renderWithProviders(<BuyNativeTokenButton nativeCurrencyInfo={nativeCurrencyInfo} usesNetworkColors={false} />)

    expect(lastButtonProps()).toMatchObject({ emphasis: 'primary' })
    expect(lastButtonProps().backgroundColor).toBeUndefined()
    expect(lastButtonTextProps().color).toBeUndefined()
  })

  it('uses the secondary button with a static theme', () => {
    renderWithProviders(<BuyNativeTokenButton usesStaticTheme nativeCurrencyInfo={nativeCurrencyInfo} />)

    expect(lastButtonProps()).toMatchObject({ emphasis: 'secondary' })
    expect(lastButtonProps().backgroundColor).toBeUndefined()
  })
})
