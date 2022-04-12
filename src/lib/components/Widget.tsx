import { JsonRpcProvider } from '@ethersproject/providers'
import { TokenInfo } from '@uniswap/token-lists'
import { Provider as Eip1193Provider } from '@web3-react/types'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, SupportedLocale } from 'constants/locales'
import { Provider as AtomProvider } from 'jotai'
import { TransactionsUpdater } from 'lib/hooks/transactions'
import { ActiveWeb3Provider } from 'lib/hooks/useActiveWeb3React'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import { TokenListProvider } from 'lib/hooks/useTokenList'
import { Provider as I18nProvider } from 'lib/i18n'
import { MulticallUpdater, store as multicallStore } from 'lib/state/multicall'
import styled, { keyframes, Theme, ThemeProvider } from 'lib/theme'
import { UNMOUNTING } from 'lib/utils/animations'
import { PropsWithChildren, StrictMode, useMemo, useState } from 'react'
import { Provider as ReduxProvider } from 'react-redux'

import { Modal, Provider as DialogProvider } from './Dialog'
import ErrorBoundary, { ErrorHandler } from './Error/ErrorBoundary'

const WidgetWrapper = styled.div<{ width?: number | string }>`
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  box-sizing: border-box;
  color: ${({ theme }) => theme.primary};
  display: flex;
  flex-direction: column;
  font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on, 'cv03' on;
  font-size: 16px;
  font-smooth: always;
  font-variant: none;
  height: 356px;
  min-width: 300px;
  padding: 0.25em;
  position: relative;
  user-select: none;
  width: ${({ width }) => width && (isNaN(Number(width)) ? width : `${width}px`)};

  * {
    box-sizing: border-box;
    font-family: ${({ theme }) => (typeof theme.fontFamily === 'string' ? theme.fontFamily : theme.fontFamily.font)};

    @supports (font-variation-settings: normal) {
      font-family: ${({ theme }) => (typeof theme.fontFamily === 'string' ? undefined : theme.fontFamily.variable)};
    }
  }
`

const slideIn = keyframes`
  from {
    transform: translateY(calc(100% - 0.25em));
  }
`
const slideOut = keyframes`
  to {
    transform: translateY(calc(100% - 0.25em));
  }
`

const DialogWrapper = styled.div`
  border-radius: ${({ theme }) => theme.borderRadius * 0.75}em;
  height: calc(100% - 0.5em);
  left: 0;
  margin: 0.25em;
  overflow: hidden;
  position: absolute;
  top: 0;
  width: calc(100% - 0.5em);

  @supports (overflow: clip) {
    overflow: clip;
  }

  ${Modal} {
    animation: ${slideIn} 0.25s ease-in;

    &.${UNMOUNTING} {
      animation: ${slideOut} 0.25s ease-out;
    }
  }
`

export type WidgetProps = {
  theme?: Theme
  locale?: SupportedLocale
  provider?: Eip1193Provider | JsonRpcProvider
  jsonRpcEndpoint?: string | JsonRpcProvider
  tokenList?: string | TokenInfo[]
  width?: string | number
  dialog?: HTMLElement | null
  className?: string
  onError?: ErrorHandler
}

export default function Widget(props: PropsWithChildren<WidgetProps>) {
  const { children, theme, provider, jsonRpcEndpoint, dialog: userDialog, className, onError } = props
  const width = useMemo(() => {
    if (props.width && props.width < 300) {
      console.warn(`Widget width must be at least 300px (you set it to ${props.width}). Falling back to 300px.`)
      return 300
    }
    return props.width ?? 360
  }, [props.width])
  const locale = useMemo(() => {
    if (props.locale && ![...SUPPORTED_LOCALES, 'pseudo'].includes(props.locale)) {
      console.warn(`Unsupported locale: ${props.locale}. Falling back to ${DEFAULT_LOCALE}.`)
      return DEFAULT_LOCALE
    }
    return props.locale ?? DEFAULT_LOCALE
  }, [props.locale])

  const [dialog, setDialog] = useState<HTMLDivElement | null>(null)
  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <WidgetWrapper width={width} className={className}>
          <I18nProvider locale={locale}>
            <DialogWrapper ref={setDialog} />
            <DialogProvider value={userDialog || dialog}>
              <ErrorBoundary onError={onError}>
                <ReduxProvider store={multicallStore}>
                  <AtomProvider>
                    <ActiveWeb3Provider provider={provider} jsonRpcEndpoint={jsonRpcEndpoint}>
                      <BlockNumberProvider>
                        <MulticallUpdater />
                        <TransactionsUpdater />
                        <TokenListProvider list={props.tokenList}>{children}</TokenListProvider>
                      </BlockNumberProvider>
                    </ActiveWeb3Provider>
                  </AtomProvider>
                </ReduxProvider>
              </ErrorBoundary>
            </DialogProvider>
          </I18nProvider>
        </WidgetWrapper>
      </ThemeProvider>
    </StrictMode>
  )
}
