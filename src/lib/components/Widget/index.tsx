import styled, { getTheme, Provider as ThemeProvider } from 'lib/styled'
import { ReactNode, useMemo, useRef } from 'react'

import { Provider as ModalProvider } from '../Modal'

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.bg};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.font};
  font-size: 16px;
  max-height: 360px;
  max-width: 360px;
  min-height: 325px;
  min-width: 325px;
  padding: 12px;
  position: relative;
`

export interface WidgetProps {
  darkMode: boolean
  children: ReactNode
}

export default function Widget({ darkMode, children }: WidgetProps) {
  const theme = useMemo(() => getTheme(darkMode), [darkMode])
  const modal = useRef<HTMLDivElement>(null)
  return (
    <ThemeProvider theme={theme}>
      <Wrapper>
        <div ref={modal} />
        <ModalProvider value={modal.current}>{children}</ModalProvider>
      </Wrapper>
    </ThemeProvider>
  )
}
