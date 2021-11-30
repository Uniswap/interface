import { Trans } from '@lingui/macro'
import { atom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { useUpdateAtom } from 'jotai/utils'
import useColor, { prefetchColor } from 'lib/hooks/useColor'
import styled, { DynamicProvider as DynamicThemeProvider, icon, Theme } from 'lib/theme'
import * as ThemedText from 'lib/theme/text'
import { pickAtom } from 'lib/utils/atoms'
import { ReactNode, useMemo } from 'react'
import { Book } from 'react-feather'

import Column from '../Column'
import Row from '../Row'
import { inputAtom, outputAtom } from './state'
import TokenInput from './TokenInput'

export const colorAtom = atom<string | undefined>(undefined)

const BookIcon = icon(Book)

const OutputColumn = styled(Column)<{ hasColor: boolean | null; theme: Theme }>`
  background-color: ${({ theme }) => theme.module};
  border-radius: ${({ theme }) => theme.borderRadius - 0.25}em;
  padding: 0.75em;
  position: relative;

  // Set transitions to reduce color flashes when switching color/token.
  // When color loads, transition the background so that it transitions from the empty or last state, but not _to_ the empty state.
  transition: ${({ hasColor }) => (hasColor ? 'background-color 0.3s ease-out' : undefined)};
  * {
    // When color is loading, delay the color/stroke so that it seems to transition from the last state.
    transition: ${({ hasColor }) => (hasColor === null ? 'color 0.3s ease-in, stroke 0.3s ease-in' : undefined)};
  }
`

export default function Output({ children }: { children: ReactNode }) {
  const input = useAtomValue(inputAtom)
  const output = useAtomValue(outputAtom)
  const setValue = useUpdateAtom(pickAtom(outputAtom, 'value'))
  const setToken = useUpdateAtom(pickAtom(outputAtom, 'token'))
  const balance = 123.45

  const overrideColor = useAtomValue(colorAtom)
  const dynamicColor = useColor(output.token)
  prefetchColor(input.token) // extract eagerly in case of reversal
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
          <ThemedText.Subhead2>
            <Trans>For</Trans>
          </ThemedText.Subhead2>
        </Row>
        <TokenInput input={output} onChangeInput={setValue} onChangeToken={setToken}>
          <ThemedText.Body2 color="secondary">
            <Row>
              {usdc}
              {balance && (
                <Row gap={0.5}>
                  <Row gap={0.25}>
                    <BookIcon />
                    {balance}
                  </Row>
                </Row>
              )}
            </Row>
          </ThemedText.Body2>
        </TokenInput>
        {children}
      </OutputColumn>
    </DynamicThemeProvider>
  )
}
