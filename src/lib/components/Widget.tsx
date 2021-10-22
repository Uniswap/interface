import { Provider } from 'jotai'
import styled, { getTheme, Provider as ThemeProvider } from 'lib/theme'
import { ReactNode, useMemo, useState } from 'react'

import { Provider as DialogProvider } from './Dialog'

const WidgetWrapper = styled.div`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 16px;
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
    <Provider>
      <ThemeProvider theme={theme}>
        <WidgetWrapper>
          <div ref={setDialog} />
          <DialogProvider value={dialog}>{children}</DialogProvider>
        </WidgetWrapper>
      </ThemeProvider>
    </Provider>
  )
}
