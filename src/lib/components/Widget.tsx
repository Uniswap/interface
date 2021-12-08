import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { Provider as AtomProvider, useAtom } from 'jotai'
import EIP1193Connector from 'lib/connectors/EIP1193'
import { Provider as I18nProvider } from 'lib/i18n'
import { connectorAtom } from 'lib/state'
import styled, { Provider as ThemeProvider, Theme } from 'lib/theme'
import { ReactNode, useEffect, useState } from 'react'
import { Provider as EthProvider } from 'widgets-web3-react/types'

import { Provider as DialogProvider } from './Dialog'

const WidgetWrapper = styled.div`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  height: 340px; // 21.25em
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
  jsonRpcEndpoint?: string
}

export default function Widget({ children, theme, locale = DEFAULT_LOCALE, provider, jsonRpcEndpoint }: WidgetProps) {
  const [, setConnector] = useAtom(connectorAtom)
  useEffect(() => {
    const connector = new EIP1193Connector({ provider, jsonRpcEndpoint })
    setConnector(connector)
  }, [setConnector, provider, jsonRpcEndpoint])

  const [dialog, setDialog] = useState<HTMLDivElement | null>(null)
  return (
    <AtomProvider>
      <ThemeProvider theme={theme}>
        <I18nProvider locale={locale}>
          <WidgetWrapper>
            <div ref={setDialog} />
            <DialogProvider value={dialog}>{children}</DialogProvider>
          </WidgetWrapper>
        </I18nProvider>
      </ThemeProvider>
    </AtomProvider>
  )
}
