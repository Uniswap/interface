import { ReactNode, useMemo, useRef } from 'react'

import themed, { getTheme, Provider as ThemeProvider } from '../../themed'
import { Provider as ModalProvider } from '../Modal'

const Wrapper = themed.div`
  background-color: ${({ theme }) => theme.bg1};
  border-radius: 16px;
  box-sizing: border-box;
  font-family: ${({ theme }) => theme.font};
  font-size: 16px;
  max-height: 305px;
  max-width: 360px;
  min-height: 305px;
  min-width: 360px;
  padding: 4px;
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
