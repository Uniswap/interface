import 'inter-ui'

import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { Provider as AtomProvider, useAtom } from 'jotai'
import ErrorBoundary from 'lib/components/ErrorBoundary'
import { Provider as I18nProvider } from 'lib/i18n'
import { injectedConnectorAtom, networkConnectorAtom } from 'lib/state'
import styled, { Theme, ThemeProvider } from 'lib/theme'
import { ReactNode, useEffect, useState } from 'react'
import { initializeConnector } from 'widgets-web3-react/core'
import { EIP1193 } from 'widgets-web3-react/eip1193'
import { Network } from 'widgets-web3-react/network'
import { Provider as EthProvider } from 'widgets-web3-react/types'

import { Provider as DialogProvider } from './Dialog'

const WidgetWrapper = styled.div<{ width?: number | string }>`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  color: ${({ theme }) => theme.primary};
  display: flex;
  flex-direction: column;
  font-size: 16px;
  height: 352px;
  min-width: 300px;
  padding: 0.25em;
  position: relative;
  width: ${({ width }) => width && (isNaN(Number(width)) ? width : `${width}px`)};

  * {
    box-sizing: border-box;
    font-family: ${({ theme }) => theme.fontFamily};
    user-select: none;
  }
`

export interface WidgetProps {
  children: ReactNode
  theme?: Theme
  locale?: SupportedLocale
  provider?: EthProvider
  jsonRpcEndpoint?: string
  width?: string | number
  className?: string
}

export default function Widget({
  children,
  theme,
  locale = DEFAULT_LOCALE,
  provider,
  jsonRpcEndpoint,
  width,
  className,
}: WidgetProps) {
  const [, setNetworkConnector] = useAtom(networkConnectorAtom)
  useEffect(() => {
    if (!jsonRpcEndpoint) {
      return
    }
    const [connector, hooks] = initializeConnector<Network>((actions) => new Network(actions, jsonRpcEndpoint))
    setNetworkConnector([connector, hooks])
  }, [setNetworkConnector, jsonRpcEndpoint])

  const [, setInjectedConnector] = useAtom(injectedConnectorAtom)
  useEffect(() => {
    if (!provider) {
      return
    }
    const [connector, hooks] = initializeConnector<EIP1193>((actions) => new EIP1193(actions, provider))
    setInjectedConnector([connector, hooks])
  }, [setInjectedConnector, provider])

  const [dialog, setDialog] = useState<HTMLDivElement | null>(null)
  return (
    <ErrorBoundary>
      <AtomProvider>
        <ThemeProvider theme={theme}>
          <I18nProvider locale={locale}>
            <WidgetWrapper width={width} className={className}>
              <div ref={setDialog} />
              <DialogProvider value={dialog}>{children}</DialogProvider>
            </WidgetWrapper>
          </I18nProvider>
        </ThemeProvider>
      </AtomProvider>
    </ErrorBoundary>
  )
}
