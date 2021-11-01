import styled, { DynamicProvider as DynamicThemeProvider, Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { Token } from 'lib/types'
import { ReactNode } from 'react'

import Column from '../Column'
import Row from '../Row'
import TokenInput, { TokenInputProps } from './TokenInput'

const OutputColumn = styled(Column)<{ color?: string; token?: Token; theme: Theme }>`
  background-color: ${({ theme }) => theme.module};
  border-radius: ${({ theme }) => theme.borderRadius - 0.25}em;
  padding: 0.75em;
  position: relative;

  // Set transitions to reduce color flashes when switching color/token.
  // When color loads, transition the background so that it transitions from the empty or last state, but not _to_ the empty state.
  transition: ${({ color }) => (color ? 'background-color 0.3s ease-out' : undefined)};
  * {
    // When color is loading, delay the color/stroke so that it seems to transition from the last state.
    transition: ${({ color, token }) => (!color && token ? 'color 0.3s ease-in, stroke 0.3s ease-in' : undefined)};
  }
`

interface SwapOutputProps extends TokenInputProps {
  color?: string
  children: ReactNode
}

export default function SwapOutput({ color, token, children, ...props }: SwapOutputProps) {
  return (
    <DynamicThemeProvider color={color}>
      <OutputColumn color={color} token={token} gap={0.75}>
        <Row>
          <TYPE.subhead3>For</TYPE.subhead3>
        </Row>
        <TokenInput token={token} {...props} />
        {children}
      </OutputColumn>
    </DynamicThemeProvider>
  )
}
