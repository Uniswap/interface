import Swap, { SwapProps } from './components/Swap'
import Widget, { WidgetProps } from './components/Widget'

export type { ErrorHandler } from './components/Error/ErrorBoundary'
export type { FeeOptions } from './hooks/swap/useSyncConvenienceFee'
export type { DefaultAddress, TokenDefaults } from './hooks/swap/useSyncTokenDefaults'
export type { Theme } from './theme'
export { darkTheme, lightTheme } from './theme'
export type { Provider as EthersProvider } from '@ethersproject/abstract-provider'
export type { TokenInfo } from '@uniswap/token-lists'
export type { Provider as Eip1193Provider } from '@web3-react/types'
export type { SupportedLocale } from 'constants/locales'
export { SUPPORTED_LOCALES } from 'constants/locales'

export type SwapWidgetProps = SwapProps & WidgetProps

export function SwapWidget(props: SwapWidgetProps) {
  return (
    <Widget {...props}>
      <Swap {...props} />
    </Widget>
  )
}
