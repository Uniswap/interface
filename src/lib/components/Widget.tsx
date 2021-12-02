import { Provider as EthProvider } from '@ethersproject/abstract-provider'
import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { Provider as AtomProvider, useAtom } from 'jotai'
import { Provider as I18nProvider } from 'lib/i18n'
import { providerAtom } from 'lib/state'
import styled, { Theme, ThemeProvider } from 'lib/theme'
import { ReactNode, useEffect, useState } from 'react'

import { Provider as DialogProvider } from './Dialog'

const WidgetWrapper = styled.div`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  min-height: 340px; // 21.25em
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
  locale?: SupportedLocale
  provider?: EthProvider
  className?: string
}

export default function Widget({ children, theme, locale = DEFAULT_LOCALE, provider, className }: WidgetProps) {
  const [, setProvider] = useAtom(providerAtom)
  useEffect(() => {
    setProvider(provider)
  }, [setProvider, provider])
  const [dialog, setDialog] = useState<HTMLDivElement | null>(null)
  return (
    <AtomProvider>
      <ThemeProvider theme={theme}>
        <I18nProvider locale={locale}>
          <WidgetWrapper className={className} /* required for styled-components */>
            <div ref={setDialog} />
            <DialogProvider value={dialog}>{children}</DialogProvider>
          </WidgetWrapper>
        </I18nProvider>
      </ThemeProvider>
    </AtomProvider>
  )
}
