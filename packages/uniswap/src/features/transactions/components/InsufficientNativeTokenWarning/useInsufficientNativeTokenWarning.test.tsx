import { GasFeeResult } from '@universe/api'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useInsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/useInsufficientNativeTokenWarning'
import { renderHookWithProviders } from 'uniswap/src/test/render'

const ETH = nativeOnChain(UniverseChainId.Mainnet)

const gasFee: GasFeeResult = {
  value: '21000000000000', // ~0.000021 ETH
  displayValue: '21000000000000',
  isLoading: false,
  error: null,
}

function buildWarning(overrides: Partial<Warning>): Warning {
  return {
    type: WarningLabel.InsufficientFunds,
    severity: WarningSeverity.None,
    action: WarningAction.DisableReview,
    title: 'Insufficient ETH balance',
    currency: ETH,
    ...overrides,
  }
}

describe(useInsufficientNativeTokenWarning, () => {
  it('returns null when only an InsufficientFunds warning is present for a native swap input', () => {
    // Regression: previously this case promoted the generic insufficient-funds warning into
    // the gas-themed "Not enough ETH to swap" banner + modal, which was misleading copy.
    const warnings = [buildWarning({ type: WarningLabel.InsufficientFunds, currency: ETH })]

    const { result } = renderHookWithProviders(() =>
      useInsufficientNativeTokenWarning({ flow: 'swap', gasFee, warnings }),
    )

    expect(result.current).toBeNull()
  })

  it('returns null when only an InsufficientFunds warning is present on send flow', () => {
    const warnings = [buildWarning({ type: WarningLabel.InsufficientFunds, currency: ETH })]

    const { result } = renderHookWithProviders(() =>
      useInsufficientNativeTokenWarning({ flow: 'send', gasFee, warnings }),
    )

    expect(result.current).toBeNull()
  })

  it('returns a warning payload when InsufficientGasFunds is present on swap flow', () => {
    const warnings = [
      buildWarning({
        type: WarningLabel.InsufficientGasFunds,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableSubmit,
        currency: ETH,
      }),
    ]

    const { result } = renderHookWithProviders(() =>
      useInsufficientNativeTokenWarning({ flow: 'swap', gasFee, warnings }),
    )

    expect(result.current).not.toBeNull()
    expect(result.current?.warning.type).toBe(WarningLabel.InsufficientGasFunds)
    expect(result.current?.nativeCurrency.symbol).toBe('ETH')
  })

  it('prefers InsufficientGasFunds when both warnings are present', () => {
    const warnings = [
      buildWarning({ type: WarningLabel.InsufficientFunds, currency: ETH }),
      buildWarning({
        type: WarningLabel.InsufficientGasFunds,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableSubmit,
        currency: ETH,
      }),
    ]

    const { result } = renderHookWithProviders(() =>
      useInsufficientNativeTokenWarning({ flow: 'swap', gasFee, warnings }),
    )

    expect(result.current?.warning.type).toBe(WarningLabel.InsufficientGasFunds)
  })

  it('returns null when there are no warnings', () => {
    const { result } = renderHookWithProviders(() =>
      useInsufficientNativeTokenWarning({ flow: 'swap', gasFee, warnings: [] }),
    )

    expect(result.current).toBeNull()
  })
})
