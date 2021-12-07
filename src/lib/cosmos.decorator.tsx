import { Provider } from '@ethersproject/abstract-provider'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from 'constants/locales'
import { atom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import styled, { darkTheme, defaultTheme } from 'lib/theme'
import { ReactNode } from 'react'
import { useSelect, useValue } from 'react-cosmos/fixture'
import { createGlobalStyle } from 'styled-components'

import Widget from './components/Widget'
import Connectors from './cosmos/components/Connectors'

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
  }
`

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
`

export const providerAtom = atom<Provider | undefined>(undefined)

export default function WidgetDecorator({ children }: { children: ReactNode }) {
  const [width] = useValue('width', { defaultValue: 272 })
  const [theme] = useValue('theme', { defaultValue: { ...defaultTheme, ...darkTheme } })
  const [locale] = useSelect('locale', { defaultValue: DEFAULT_LOCALE, options: ['pseudo', ...SUPPORTED_LOCALES] })
  const provider = useAtomValue(providerAtom)
  return (
    <>
      <GlobalStyle />
      <Connectors />
      <Wrapper>
        <Widget width={width} theme={theme} locale={locale} provider={provider}>
          {children}
        </Widget>
      </Wrapper>
    </>
  )
}
