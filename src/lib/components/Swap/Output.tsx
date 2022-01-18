import { Trans } from '@lingui/macro'
import { atom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import useCurrencyColor, { usePrefetchCurrencyColor } from 'lib/hooks/useCurrencyColor'
import { inputAtom, outputAtom, useUpdateInputToken, useUpdateInputValue } from 'lib/state/swap'
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
  const input = useAtomValue(inputAtom)
  const output = useAtomValue(outputAtom)
  const setValue = useUpdateInputValue(outputAtom)
  const setToken = useUpdateInputToken(outputAtom)
  const balance = 123.45

  const overrideColor = useAtomValue(colorAtom)
  const dynamicColor = useCurrencyColor(output.token)
  usePrefetchCurrencyColor(input.token) // extract eagerly in case of reversal
  const color = overrideColor || dynamicColor
  const hasColor = output.token ? Boolean(color) || null : false

  const change = useMemo(() => {
    if (input.usdc && output.usdc) {
      const change = output.usdc / input.usdc - 1
      const percent = (change * 100).toPrecision(3)
      return change > 0 ? ` (+${percent}%)` : `(${percent}%)`
    }
    return ''
  }, [input, output])
  const usdc = useMemo(() => {
    if (output.usdc) {
      return `~ $${output.usdc.toLocaleString('en')}${change}`
    }
    return '-'
  }, [change, output])

  return (
    <DynamicThemeProvider color={color}>
      <OutputColumn hasColor={hasColor} gap={0.5}>
        <Row>
          <ThemedText.Subhead2 color="secondary">
            <Trans>For</Trans>
          </ThemedText.Subhead2>
        </Row>
        <TokenInput input={output} disabled={disabled} onChangeInput={setValue} onChangeToken={setToken}>
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
