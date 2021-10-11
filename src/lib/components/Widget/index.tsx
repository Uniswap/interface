import { ReactNode, useMemo, useState } from 'react'

import themed, { getTheme, Provider as ThemeProvider } from '../../themed'
import { Provider as ModalProvider } from '../Modal'

const Wrapper = themed.div`
  background-color: ${({ theme }) => theme.bg};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.font};
  font-size: 16px;
  max-height: 360px;
  max-width: 360px;
  min-height: 360px;
  min-width: 360px;
  padding: 12px;
  position: relative;
`

export interface WidgetProps {
  darkMode: boolean
  children: ReactNode
}

export default function Widget({ darkMode, children }: WidgetProps) {
  const theme = useMemo(() => getTheme(darkMode), [darkMode])
  const [modal, setModal] = useState<HTMLDivElement | null>(null)

  return (
    <ThemeProvider theme={theme}>
      <Wrapper>
        <div ref={setModal} />
        <ModalProvider value={modal}>{children}</ModalProvider>
      </Wrapper>
    </ThemeProvider>
  )
}
