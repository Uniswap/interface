import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { atom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import BrandedFooter from 'lib/components/BrandedFooter'
import { useIsSwapFieldIndependent, useSwapAmount, useSwapCurrency, useSwapInfo } from 'lib/hooks/swap'
import useCurrencyColor from 'lib/hooks/useCurrencyColor'
import { Field } from 'lib/state/swap'
import styled, { DynamicThemeProvider, ThemedText } from 'lib/theme'
import { PropsWithChildren, useMemo } from 'react'
import { TradeState } from 'state/routing/types'
import { computeFiatValuePriceImpact } from 'utils/computeFiatValuePriceImpact'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { getPriceImpactWarning } from 'utils/prices'

import Column from '../Column'
import Row from '../Row'
import { Balance, InputProps, LoadingRow } from './Input'
import TokenInput from './TokenInput'

export const colorAtom = atom<string | undefined>(undefined)

const OutputColumn = styled(Column)<{ hasColor: boolean | null }>`
  background-color: ${({ theme }) => theme.module};
  border-radius: ${({ theme }) => theme.borderRadius - 0.25}em;
  padding: 0.75em;
  padding-bottom: 0.5em;
  position: relative;

  // Set transitions to reduce color flashes when switching color/token.
  // When color loads, transition the background so that it transitions from the empty or last state, but not _to_ the empty state.
  transition: ${({ hasColor }) => (hasColor ? 'background-color 0.25s ease-out' : undefined)};
  > {
    // When color is loading, delay the color/stroke so that it seems to transition from the last state.
    transition: ${({ hasColor }) => (hasColor === null ? 'color 0.25s ease-in, stroke 0.25s ease-in' : undefined)};
  }
`

export default function Output({ disabled, focused, children }: PropsWithChildren<InputProps>) {
  const { i18n } = useLingui()

  const {
    currencyBalances: { [Field.OUTPUT]: balance },
    trade: { state: tradeState },
    tradeCurrencyAmounts: { [Field.INPUT]: inputCurrencyAmount, [Field.OUTPUT]: outputCurrencyAmount },
  } = useSwapInfo()

  const [swapOutputAmount, updateSwapOutputAmount] = useSwapAmount(Field.OUTPUT)
  const [swapOutputCurrency, updateSwapOutputCurrency] = useSwapCurrency(Field.OUTPUT)

  const isRouteLoading = tradeState === TradeState.SYNCING || tradeState === TradeState.LOADING
  const isDependentField = !useIsSwapFieldIndependent(Field.OUTPUT)
  const isLoading = isRouteLoading && isDependentField

  const overrideColor = useAtomValue(colorAtom)
  const dynamicColor = useCurrencyColor(swapOutputCurrency)
  const color = overrideColor || dynamicColor

  // different state true/null/false allow smoother color transition
  const hasColor = swapOutputCurrency ? Boolean(color) || null : false

  const inputUSDC = useUSDCValue(inputCurrencyAmount)
  const outputUSDC = useUSDCValue(outputCurrencyAmount)

  const priceImpact = useMemo(() => {
    const fiatValuePriceImpact = computeFiatValuePriceImpact(inputUSDC, outputUSDC)
    if (!fiatValuePriceImpact) return null

    const color = getPriceImpactWarning(fiatValuePriceImpact)
    const sign = fiatValuePriceImpact.lessThan(0) ? '+' : ''
    const displayedPriceImpact = parseFloat(fiatValuePriceImpact.multiply(-1)?.toSignificant(3))
    return (
      <ThemedText.Body2 color={color}>
        ({sign}
        {displayedPriceImpact}%)
      </ThemedText.Body2>
    )
  }, [inputUSDC, outputUSDC])

  return (
    <DynamicThemeProvider color={color}>
      <OutputColumn hasColor={hasColor} gap={0.5}>
        <Row>
          <ThemedText.Subhead1 color="secondary">
            <Trans>For</Trans>
          </ThemedText.Subhead1>
        </Row>
        <TokenInput
          currency={swapOutputCurrency}
          amount={(swapOutputAmount !== undefined ? swapOutputAmount : outputCurrencyAmount?.toSignificant(6)) ?? ''}
          disabled={disabled}
          onChangeInput={updateSwapOutputAmount}
          onChangeCurrency={updateSwapOutputCurrency}
          loading={isLoading}
        >
          <ThemedText.Body2 color="secondary">
            <Row>
              <LoadingRow gap={0.5} $loading={isLoading}>
                {outputUSDC ? `$${outputUSDC.toFixed(2)}` : '-'} {priceImpact}
              </LoadingRow>
              {balance && (
                <Balance focused={focused}>
                  Balance: <span style={{ userSelect: 'text' }}>{formatCurrencyAmount(balance, 4, i18n.locale)}</span>
                </Balance>
              )}
            </Row>
          </ThemedText.Body2>
        </TokenInput>
        {children}
        <BrandedFooter />
      </OutputColumn>
    </DynamicThemeProvider>
  )
}
