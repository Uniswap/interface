import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { Provider as AtomProvider } from 'jotai'
import { UNMOUNTING } from 'lib/hooks/useUnmount'
import { Provider as I18nProvider } from 'lib/i18n'
import styled, { keyframes, Theme, ThemeProvider } from 'lib/theme'
import { ComponentProps, JSXElementConstructor, PropsWithChildren, StrictMode, useRef } from 'react'
import { Provider as EthProvider } from 'widgets-web3-react/types'

import { Provider as DialogProvider } from './Dialog'
import ErrorBoundary, { ErrorHandler } from './Error/ErrorBoundary'
import Web3Provider from './Web3Provider'

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
  overflow-y: hidden;
  padding: 0.25em;
  position: relative;
  width: ${({ width }) => width && (isNaN(Number(width)) ? width : `${width}px`)};

  @supports (overflow: clip) {
    overflow-y: clip;
  }

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

  .dialog.${UNMOUNTING} {
    animation: ${slideDown} 0.25s ease-in-out;
  }
`

export type WidgetProps<T extends JSXElementConstructor<any> | undefined = undefined> = {
  theme?: Theme
  locale?: SupportedLocale
  provider?: EthProvider
  jsonRpcEndpoint?: string
  width?: string | number
  dialog?: HTMLElement | null
  className?: string
  onError?: ErrorHandler
} & (T extends JSXElementConstructor<any>
  ? ComponentProps<T>
  : // eslint-disable-next-line @typescript-eslint/ban-types
    {})

export default function Widget({
  children,
  theme,
  locale = DEFAULT_LOCALE,
  provider,
  jsonRpcEndpoint,
  width = 360,
  dialog,
  className,
  onError,
}: PropsWithChildren<WidgetProps>) {
  const wrapper = useRef<HTMLDivElement>(null)

  return (
    <StrictMode>
      <I18nProvider locale={locale}>
        <ThemeProvider theme={theme}>
          <WidgetWrapper width={width} className={className} ref={wrapper}>
            <DialogProvider value={dialog || wrapper.current}>
              <ErrorBoundary onError={onError}>
                <AtomProvider>
                  <Web3Provider provider={provider} jsonRpcEndpoint={jsonRpcEndpoint}>
                    {children}
                  </Web3Provider>
                </AtomProvider>
              </ErrorBoundary>
            </DialogProvider>
          </WidgetWrapper>
        </ThemeProvider>
      </I18nProvider>
    </StrictMode>
  )
}
