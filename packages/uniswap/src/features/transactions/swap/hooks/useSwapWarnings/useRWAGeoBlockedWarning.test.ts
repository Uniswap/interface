import { renderHook } from '@testing-library/react'
import type { Currency } from '@uniswap/sdk-core'
import { Token } from '@uniswap/sdk-core'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useRWAGeoBlockedWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useRWAGeoBlockedWarning'
import { CurrencyField } from 'uniswap/src/types/currency'

const mockT = vi.hoisted(() => vi.fn((key: string) => key))
const mockUseIsRWAGeoBlocked = vi.hoisted(() => vi.fn<(currency: Maybe<Currency>) => boolean>(() => false))

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: typeof mockT } => ({ t: mockT }),
}))

vi.mock('uniswap/src/features/rwa/useIsRWAGeoBlocked', () => ({
  useIsRWAGeoBlocked: mockUseIsRWAGeoBlocked,
}))

const ARBITRUM_CHAIN_ID = 42161
const ARBITRUM_TSLA_ADDRESS = '0x8aD3c73F833d3F9A523aB01476625F269aEB7Cf0'
const MAINNET_CHAIN_ID = 1
const MAINNET_DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

function tokenCurrencyInfo(token: Token): CurrencyInfo {
  return {
    currency: token,
    currencyId: `${token.chainId}-${token.address}`,
    logoUrl: null,
  }
}

describe(useRWAGeoBlockedWarning, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsRWAGeoBlocked.mockReturnValue(false)
  })

  it('returns undefined when neither swap currency is geoblocked', () => {
    const mainnetDai = new Token(MAINNET_CHAIN_ID, MAINNET_DAI_ADDRESS, 18, 'DAI', 'Dai Stablecoin')

    const { result } = renderHook(() =>
      useRWAGeoBlockedWarning({
        [CurrencyField.INPUT]: tokenCurrencyInfo(mainnetDai),
        [CurrencyField.OUTPUT]: undefined,
      }),
    )

    expect(result.current).toBeUndefined()
  })

  it('blocks swaps when the output currency is a non-mainnet RWA', () => {
    const arbitrumTsla = new Token(ARBITRUM_CHAIN_ID, ARBITRUM_TSLA_ADDRESS, 18, 'TSLAX', 'Tesla xStock')

    mockUseIsRWAGeoBlocked.mockImplementation((currency) => currency?.chainId === ARBITRUM_CHAIN_ID)

    const { result } = renderHook(() =>
      useRWAGeoBlockedWarning({
        [CurrencyField.INPUT]: tokenCurrencyInfo(
          new Token(MAINNET_CHAIN_ID, MAINNET_DAI_ADDRESS, 18, 'DAI', 'Dai Stablecoin'),
        ),
        [CurrencyField.OUTPUT]: tokenCurrencyInfo(arbitrumTsla),
      }),
    )

    expect(mockUseIsRWAGeoBlocked).toHaveBeenCalledWith(expect.objectContaining({ chainId: ARBITRUM_CHAIN_ID }))
    expect(result.current).toEqual({
      type: WarningLabel.RWAGeoBlocked,
      severity: WarningSeverity.Blocked,
      action: WarningAction.DisableReview,
      buttonText: 'swap.warning.rwaGeoBlocked.button',
    })
  })
})
