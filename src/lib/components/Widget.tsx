import { JsonRpcProvider } from '@ethersproject/providers'
import { Provider as Eip1193Provider } from '@web3-react/types'
import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { Provider as AtomProvider } from 'jotai'
import { TransactionsUpdater } from 'lib/hooks/transactions'
import { ActiveWeb3Provider } from 'lib/hooks/useActiveWeb3React'
import { BlockUpdater } from 'lib/hooks/useBlockNumber'
import { Provider as I18nProvider } from 'lib/i18n'
import { MulticallUpdater, store as multicallStore } from 'lib/state/multicall'
import styled, { keyframes, Theme, ThemeProvider } from 'lib/theme'
import { UNMOUNTING } from 'lib/utils/animations'
import { PropsWithChildren, StrictMode, useState } from 'react'
import { Provider as ReduxProvider } from 'react-redux'

import { Modal, Provider as DialogProvider } from './Dialog'
import ErrorBoundary, { ErrorHandler } from './Error/ErrorBoundary'
import WidgetPropValidator from './Error/WidgetsPropsValidator'

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

function Updaters() {
  return (
    <>
      <BlockUpdater />
      <MulticallUpdater />
      <TransactionsUpdater />
    </>
  )
}

export type WidgetProps = {
  theme?: Theme
  locale?: SupportedLocale
  provider?: Eip1193Provider | JsonRpcProvider
  jsonRpcEndpoint?: string | JsonRpcProvider
  width?: string | number
  dialog?: HTMLElement | null
  className?: string
  onError?: ErrorHandler
}

export default function Widget(props: PropsWithChildren<WidgetProps>) {
  const {
    children,
    theme,
    locale = DEFAULT_LOCALE,
    provider,
    jsonRpcEndpoint,
    width = 360,
    dialog: userDialog,
    className,
    onError,
  } = props
  const [dialog, setDialog] = useState<HTMLDivElement | null>(null)
  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <WidgetWrapper width={width} className={className}>
          <I18nProvider locale={locale}>
            <DialogWrapper ref={setDialog} />
            <DialogProvider value={userDialog || dialog}>
              <ErrorBoundary onError={onError}>
                <WidgetPropValidator {...props} />
                <ReduxProvider store={multicallStore}>
                  <AtomProvider>
                    <ActiveWeb3Provider provider={provider} jsonRpcEndpoint={jsonRpcEndpoint}>
                      <Updaters />
                      {children}
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
