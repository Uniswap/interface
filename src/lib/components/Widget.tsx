import 'inter-ui'

import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { Provider as AtomProvider } from 'jotai'
import ErrorBoundary from 'lib/components/ErrorBoundary'
import useProviderInfo from 'lib/hooks/useProviderInfo'
import { Provider as I18nProvider } from 'lib/i18n'
import styled, { Theme, ThemeProvider } from 'lib/theme'
import { ReactNode, useState } from 'react'
import { Provider as EthProvider } from 'widgets-web3-react/types'

import { Provider as DialogProvider } from './Dialog'

const WidgetWrapper = styled.div<{ width?: number | string }>`
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  color: ${({ theme }) => theme.primary};
  display: flex;
  flex-direction: column;
  font-size: 16px;
  min-height: 340px; // 21.25em
  min-width: 272px; // 17em
  width: ${({ width }) => width && (isNaN(Number(width)) ? width : `${width}px`)};
  padding: 0.25em;
  position: relative;

  * {
    box-sizing: border-box;
    font-family: ${({ theme }) => theme.fontFamily};
    user-select: none;
  }
`

function NoConnectorAlert() {
  return <div>hey, add a connector</div>
}

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
  const connector = useProviderInfo(provider, jsonRpcEndpoint)
  const [dialog, setDialog] = useState<HTMLDivElement | null>(null)
  const hasConnector = connector[0] !== undefined
  return (
    <ErrorBoundary>
      <AtomProvider>
        <ThemeProvider theme={theme}>
          <I18nProvider locale={locale}>
            <WidgetWrapper width={width} className={className}>
              <div ref={setDialog} />
              <DialogProvider value={dialog}>{hasConnector ? children : <NoConnectorAlert />}</DialogProvider>
            </WidgetWrapper>
          </I18nProvider>
        </ThemeProvider>
      </AtomProvider>
    </ErrorBoundary>
  )
}
