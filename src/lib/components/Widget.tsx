import { Provider as AtomProvider } from 'jotai'
import styled, { Provider as ThemeProvider, Theme } from 'lib/theme'
import { ReactNode, useState } from 'react'

import { Provider as DialogProvider } from './Dialog'

const WidgetWrapper = styled.div`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  height: 350px; // 21.875em
  min-width: 272px; // 17em
  padding: 0.25em;
  position: relative;

  * {
    box-sizing: border-box;
    font-family: ${({ theme }) => theme.fontFamily};
  }
`

export interface WidgetProps {
  children: ReactNode
  theme?: Partial<Theme>
}

export default function Widget({ children, theme }: WidgetProps) {
  const [dialog, setDialog] = useState<HTMLDivElement | null>(null)
  return (
    <AtomProvider>
      <ThemeProvider theme={theme}>
        <WidgetWrapper>
          <div ref={setDialog} />
          <DialogProvider value={dialog}>{children}</DialogProvider>
        </WidgetWrapper>
      </ThemeProvider>
    </AtomProvider>
  )
}
