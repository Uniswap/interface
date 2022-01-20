import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { atom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { useOutputAmount, useOutputCurrency, useSwapInfo } from 'lib/hooks/swap'
import useCurrencyColor, { usePrefetchCurrencyColor } from 'lib/hooks/useCurrencyColor'
import { Field } from 'lib/state/swap'
import styled, { DynamicThemeProvider, ThemedText } from 'lib/theme'
import { ReactNode, useMemo } from 'react'

import Column from '../Column'
import Row from '../Row'
import TokenInput from './TokenInput'

export const colorAtom = atom<string | undefined>(undefined)

const OutputColumn = styled(Column)<{ hasColor: boolean | null }>`
  background-color: ${({ theme }) => theme.module};
  border-radius: ${({ theme }) => theme.borderRadius - 0.25}em;
  padding: 0.75em;
  position: relative;

  // Set transitions to reduce color flashes when switching color/token.
  // When color loads, transition the background so that it transitions from the empty or last state, but not _to_ the empty state.
  transition: ${({ hasColor }) => (hasColor ? 'background-color 0.25s ease-out' : undefined)};
  * {
    // When color is loading, delay the color/stroke so that it seems to transition from the last state.
    transition: ${({ hasColor }) => (hasColor === null ? 'color 0.25s ease-in, stroke 0.25s ease-in' : undefined)};
  }
`

interface OutputProps {
  disabled?: boolean
  children: ReactNode
}

export default function Output({ disabled, children }: OutputProps) {
  const {
    currencyBalances: { [Field.OUTPUT]: balance },
    currencyAmounts: { [Field.INPUT]: inputCurrencyAmount, [Field.OUTPUT]: outputCurrencyAmount },
  } = useSwapInfo()
  const inputUSDC = useUSDCValue(inputCurrencyAmount)
  const outputUSDC = useUSDCValue(outputCurrencyAmount)

  const [typedOutputAmount, updateTypedOutputAmount] = useOutputAmount()
  const [outputCurrency, updateOutputCurrency] = useOutputCurrency()

  const overrideColor = useAtomValue(colorAtom)
  const dynamicColor = useCurrencyColor(undefined)
  usePrefetchCurrencyColor(undefined) // extract eagerly in case of reversal
  const color = overrideColor || dynamicColor
  const hasColor = outputCurrency ? Boolean(color) || null : false

  const change = useMemo(() => {
    if (inputUSDC && outputUSDC) {
      return parseFloat(inputUSDC.divide(outputUSDC).quotient.toString())
    }
    return ''
  }, [inputUSDC, outputUSDC])

  const usdc = useMemo(() => {
    if (outputUSDC) {
      return `~ $${outputUSDC.toFixed(2)}${change}`
    }
    return '-'
  }, [change, outputUSDC])

  return (
    <DynamicThemeProvider color={color}>
      <OutputColumn hasColor={hasColor} gap={0.5}>
        <Row>
          <ThemedText.Subhead2 color="secondary">
            <Trans>For</Trans>
          </ThemedText.Subhead2>
        </Row>
        <TokenInput
          currency={outputCurrency}
          amount={(typedOutputAmount !== undefined ? typedOutputAmount : outputCurrencyAmount?.toSignificant(6)) ?? ''}
          disabled={disabled}
          onMax={balance ? () => updateTypedOutputAmount(balance.toExact()) : undefined}
          onChangeInput={(val) => updateTypedOutputAmount(val ?? '')}
          onChangeCurrency={(currency: Currency) => updateOutputCurrency(currency)}
        >
          <ThemedText.Body2 color="secondary">
            <Row>
              {usdc}
              {balance && (
                <span>
                  Balance: <span style={{ userSelect: 'text' }}>{balance}</span>
                </span>
              )}
            </Row>
          </ThemedText.Body2>
        </TokenInput>
        {children}
      </OutputColumn>
    </DynamicThemeProvider>
  )
}
