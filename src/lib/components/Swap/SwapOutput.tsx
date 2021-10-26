import styled, { DynamicProvider as DynamicThemeProvider } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode } from 'react'

import Column from '../Column'
import Row from '../Row'
import TokenInput, { TokenInputProps } from './TokenInput'

const OutputColumn = styled(Column)`
  background-color: ${({ theme }) => theme.module};
  border-radius: ${({ theme }) => theme.borderRadius - 0.25}em;
  padding: 0.75em;
  position: relative;
`

interface SwapOutputProps extends TokenInputProps {
  color?: string
  children: ReactNode
}

export default function SwapOutput({ children, color, ...props }: SwapOutputProps) {
  return (
    <DynamicThemeProvider color={color}>
      <OutputColumn gap={0.75}>
        <Row>
          <TYPE.subhead3>For</TYPE.subhead3>
        </Row>
        <TokenInput {...props} />
        {children}
      </OutputColumn>
    </DynamicThemeProvider>
  )
}
