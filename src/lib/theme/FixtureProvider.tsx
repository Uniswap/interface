import { ReactNode, useMemo } from 'react'

import styled, { getTheme, Provider, Theme } from '.'

const Wrapper = styled.div<{ height: number; theme: Theme }>`
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 16px;
  height: ${({ height }) => height}px;
  max-width: 360px;
  position: relative;
`

interface FixtureProviderProps {
  height: number
  children: ReactNode
}

export function FixtureProvider({ height, children }: FixtureProviderProps) {
  const theme = useMemo(() => getTheme(/*darkMode=*/ true), [])
  return (
    <Provider theme={theme}>
      <Wrapper height={height}>{children}</Wrapper>
    </Provider>
  )
}
