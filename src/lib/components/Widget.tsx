import styled, { getTheme, Provider as ThemeProvider } from 'lib/theme'
import { ReactNode, useMemo, useState } from 'react'

import { Provider as DialogProvider } from './Dialog'

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 16px;
  max-height: 360px;
  max-width: 360px;
  min-height: 240px;
  min-width: 240px;
  padding: 0.25em;
  position: relative;
`

export interface WidgetProps {
  children: ReactNode
}

export default function Widget({ children }: WidgetProps) {
  const theme = useMemo(() => getTheme(/*darkMode=*/ true), [])
  const [dialog, setDialog] = useState<HTMLDivElement | null>(null)
  return (
    <ThemeProvider theme={theme}>
      <Wrapper>
        <div ref={setDialog} />
        <DialogProvider value={dialog}>{children}</DialogProvider>
      </Wrapper>
    </ThemeProvider>
  )
}
