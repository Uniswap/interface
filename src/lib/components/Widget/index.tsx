import { ReactNode, useMemo } from 'react'

import themed, { getTheme, Provider as ThemeProvider } from '../../themed'

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
`

export interface WidgetProps {
  darkMode: boolean
  children: ReactNode
}

export default function Widget({ darkMode, children }: WidgetProps) {
  const theme = useMemo(() => getTheme(darkMode), [darkMode])

  return (
    <ThemeProvider theme={theme}>
      <Wrapper>{children}</Wrapper>
    </ThemeProvider>
  )
}
