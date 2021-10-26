import styled, { DynamicProvider as DynamicThemeProvider, Theme } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode } from 'react'

import Column from '../Column'
import Row from '../Row'
import TokenInput, { TokenInputProps } from './TokenInput'

const OutputColumn = styled(Column)<{ transition: boolean; theme: Theme }>`
  background-color: ${({ theme }) => theme.module};
  border-radius: ${({ theme }) => theme.borderRadius - 0.25}em;
  padding: 0.75em;
  position: relative;
  transition: ${({ transition }) => (transition ? 'background-color 0.3s ease-out' : undefined)};
`

interface SwapOutputProps extends TokenInputProps {
  color?: string
  transition: boolean
  children: ReactNode
}

export default function SwapOutput({ children, color, transition, ...props }: SwapOutputProps) {
  return (
    <DynamicThemeProvider color={color}>
      <OutputColumn transition={transition} gap={0.75}>
        <Row>
          <TYPE.subhead3>For</TYPE.subhead3>
        </Row>
        <TokenInput {...props} />
        {children}
      </OutputColumn>
    </DynamicThemeProvider>
  )
}
