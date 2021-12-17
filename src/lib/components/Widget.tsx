import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { Provider as AtomProvider, useAtom } from 'jotai'
import ErrorBoundary from 'lib/components/ErrorBoundary'
import { Provider as I18nProvider } from 'lib/i18n'
import { injectedConnectorAtom, networkConnectorAtom } from 'lib/state'
import styled, { keyframes, Theme, ThemeProvider } from 'lib/theme'
import { ReactNode, useEffect, useRef } from 'react'
import { initializeConnector } from 'widgets-web3-react/core'
import { EIP1193 } from 'widgets-web3-react/eip1193'
import { Network } from 'widgets-web3-react/network'
import { Provider as EthProvider } from 'widgets-web3-react/types'

import { Provider as DialogProvider } from './Dialog'

const slideDown = keyframes`
  to {
    top: calc(100% - 0.25em);
  }
`
const slideUp = keyframes`
  from {
    top: calc(100% - 0.25em);
  }
`

const WidgetWrapper = styled.div<{ width?: number | string }>`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  color: ${({ theme }) => theme.primary};
  display: flex;
  flex-direction: column;
  font-size: 16px;
  height: 348px;
  min-width: 300px;
  overflow-y: hidden;
  padding: 0.25em;
  position: relative;
  width: ${({ width }) => width && (isNaN(Number(width)) ? width : `${width}px`)};

  * {
    box-sizing: border-box;
    font-family: ${({ theme }) => theme.fontFamily};
    user-select: none;

    @supports (font-variation-settings: normal) {
      font-family: ${({ theme }) => theme.fontFamilyVariable};
    }
  }

  .dialog {
    animation: ${slideUp} 0.25s ease-in-out;
  }

  .dialog.unmounting {
    animation: ${slideDown} 0.25s ease-in-out;
  }
`

export interface WidgetProps {
  children: ReactNode
  theme?: Theme
  locale?: SupportedLocale
  provider?: EthProvider
  jsonRpcEndpoint?: string
  width?: string | number
  dialog?: HTMLElement | null
  className?: string
}

export default function Widget({
  children,
  theme,
  locale = DEFAULT_LOCALE,
  provider,
  jsonRpcEndpoint,
  width = 360,
  dialog,
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

  const wrapper = useRef<HTMLDivElement>(null)
  return (
    <ErrorBoundary>
      <AtomProvider>
        <ThemeProvider theme={theme}>
          <I18nProvider locale={locale}>
            <WidgetWrapper width={width} className={className} ref={wrapper}>
              <DialogProvider value={dialog || wrapper.current}>{children}</DialogProvider>
            </WidgetWrapper>
          </I18nProvider>
        </ThemeProvider>
      </AtomProvider>
    </ErrorBoundary>
  )
}
