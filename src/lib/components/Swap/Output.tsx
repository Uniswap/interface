import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { atom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import useColor, { usePrefetchColor } from 'lib/hooks/useColor'
import { Field } from 'lib/state/swap'
import styled, { DynamicThemeProvider, ThemedText } from 'lib/theme'
import { ReactNode, useMemo } from 'react'
import { useDerivedSwapInfo, useSwapActionHandlers } from 'state/swap/hooks'

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
  const { onCurrencySelection, onUserInput } = useSwapActionHandlers()
  const {
    currencies: { [Field.OUTPUT]: outputCurrency },
    parsedAmounts: { [Field.INPUT]: inputAmount, [Field.OUTPUT]: outputAmount },
    currencyBalances: { [Field.OUTPUT]: balance },
  } = useDerivedSwapInfo()

  const overrideColor = useAtomValue(colorAtom)
  const dynamicColor = useColor(outputCurrency?.wrapped)
  usePrefetchColor(outputCurrency) // extract eagerly in case of reversal
  const color = overrideColor || dynamicColor
  const hasColor = outputCurrency ? Boolean(color) || null : false

  const inputUSDCValue = useUSDCValue(inputAmount)
  const outputUSDCValue = useUSDCValue(outputAmount)
  const change = useMemo(() => {
    if (inputUSDCValue && outputUSDCValue) {
      return parseFloat(inputUSDCValue.divide(outputUSDCValue).quotient.toString())
    }
    return ''
    return undefined
  }, [inputUSDCValue, outputUSDCValue])

  const usdc = useMemo(() => {
    if (outputUSDCValue) {
      return `~ $${outputUSDCValue.toFixed(2)}${change}`
    }
    return '-'
  }, [change, outputUSDCValue])

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
          amount={outputAmount}
          disabled={disabled}
          onChangeInput={(val) => (val ? onUserInput(Field.INPUT, val?.toString()) : null)}
          onChangeCurrency={(currency: Currency) => onCurrencySelection(Field.INPUT, currency)}
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
