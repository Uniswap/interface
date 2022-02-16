import { Provider as EthersProvider } from '@ethersproject/abstract-provider'
import { Signer as EthersSigner } from '@ethersproject/abstract-signer'
import { Eip1193Bridge } from '@ethersproject/experimental'
import { ExternalProvider } from '@ethersproject/providers'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Provider as Eip1193Provider } from '@web3-react/types'
import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { Provider as AtomProvider } from 'jotai'
import { TransactionsUpdater } from 'lib/hooks/transactions'
import { BlockUpdater } from 'lib/hooks/useBlockNumber'
import { UNMOUNTING } from 'lib/hooks/useUnmount'
import { Provider as I18nProvider } from 'lib/i18n'
import { MulticallUpdater, store as multicallStore } from 'lib/state/multicall'
import styled, { keyframes, Theme, ThemeProvider } from 'lib/theme'
import { PropsWithChildren, StrictMode, useState } from 'react'
import { Provider as ReduxProvider } from 'react-redux'

import { Modal, Provider as DialogProvider } from './Dialog'
import ErrorBoundary, { ErrorHandler } from './Error/ErrorBoundary'
import WidgetPropValidator from './Error/WidgetsPropsValidator'
import Web3Provider from './Web3Provider'

const WidgetWrapper = styled.div<{ width?: number | string }>`
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  background-color: ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  color: ${({ theme }) => theme.primary};
  display: flex;
  flex-direction: column;
  font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on, 'cv03' on;
  font-size: 16px;
  font-smooth: always;
  font-variant: none;
  height: 348px;
  min-width: 300px;
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
`

const slideDown = keyframes`
  to {
    transform: translateY(calc(100% - 0.25em));
  }
`
const slideUp = keyframes`
  from {
    transform: translateY(calc(100% - 0.25em));
  }
`

const DialogWrapper = styled.div`
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
    animation: ${slideUp} 0.25s ease-in-out;
  }

  ${Modal}.${UNMOUNTING} {
    animation: ${slideDown} 0.25s ease-in-out;
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
  provider?: Eip1193Provider | ExternalProvider | JsonRpcProvider | { provider: EthersProvider; signer: EthersSigner }
  jsonRpcEndpoint?: string
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

  let eip1193: Eip1193Provider | undefined
  if (provider && 'provider' in provider && 'signer' in provider) {
    eip1193 = new Eip1193Bridge(provider.signer, provider.provider)
  } else if (provider instanceof JsonRpcProvider) {
    eip1193 = new Eip1193Bridge(provider.getSigner(), provider)
  } else if (provider) {
    eip1193 = provider as Eip1193Provider
  }

  const [dialog, setDialog] = useState<HTMLDivElement | null>(null)
  return (
    <StrictMode>
      <I18nProvider locale={locale}>
        <ThemeProvider theme={theme}>
          <WidgetWrapper width={width} className={className}>
            <DialogWrapper ref={setDialog} />
            <DialogProvider value={userDialog || dialog}>
              <ErrorBoundary onError={onError}>
                <WidgetPropValidator {...props}>
                  <ReduxProvider store={multicallStore}>
                    <AtomProvider>
                      <Web3Provider provider={eip1193} jsonRpcEndpoint={jsonRpcEndpoint}>
                        <Updaters />
                        {children}
                      </Web3Provider>
                    </AtomProvider>
                  </ReduxProvider>
                </WidgetPropValidator>
              </ErrorBoundary>
            </DialogProvider>
          </WidgetWrapper>
        </ThemeProvider>
      </I18nProvider>
    </StrictMode>
  )
}
