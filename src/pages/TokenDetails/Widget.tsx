import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { Currency } from '@uniswap/sdk-core'
import { SwapWidget } from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import { RPC_URLS } from 'constants/networks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useMemo } from 'react'
import { useIsDarkMode } from 'state/user/hooks'
import { DARK_THEME, LIGHT_THEME } from 'theme/widget'

export const WIDGET_WIDTH = 320

// TODO(zzmp): Export more types from @uniswap/widgets.
interface Slippage {
  auto: boolean
  max: number | undefined
}
enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

// TODO(zzmp): Allow singletons in @uniswap/widgets' SwapWidget.jsonRpcUrlMap.
const WIDGET_RPC_URLS = Object.entries(RPC_URLS).reduce((urls, [id, url]) => ({ ...urls, [id]: [url] }), {})
const WIDGET_ROUTER_URL = 'https://api.uniswap.org/v1/'

export default function Widget() {
  const locale = useActiveLocale()
  const theme = useWidgetTheme()
  const { provider } = useWeb3React()

  const settings /*: SwapSettingsController */ = useMemo(
    () => ({ slippage: { auto: false, max: 0 }, transactionTtl: undefined }),
    []
  )
  const value /*: SwapController */ = useMemo(() => ({}), [])
  const swapHandlers /*: SwapEventHandlers */ = useMemo(
    () => ({
      onSettingsReset: () => console.log('onSettingsReset'),
      onSlippageChange: (slippage: Slippage) => console.log('onSlippageChange', slippage),
      onTransactionDeadlineChange: (ttl: number | undefined) => console.log('onTransactionDeadlineChange', ttl),
      onTokenChange: (field: Field, token: Currency) => console.log('onTokenChange', field, token),
      onAmountChange: (field: Field, amount: string) => console.log('onAmountChange', field, amount),
      onSwitchTokens: (update: typeof value) => console.log('onSwitchTokens', update),
      onReviewSwapClick: () => console.log('onReviewSwapClick'),
      onTokenSelectorClick: (field: Field) => console.log('onTokenSelectorClick', field),
    }),
    []
  )
  const txHandlers /*: TransactionEventHandlers */ = useMemo(
    () => ({
      onTxSubmit: (hash: string, tx: unknown) => console.log('onTxSubmit'),
      onTxSuccess: (hash: string, receipt: TransactionReceipt) => console.log('onTxSuccess'),
      // TODO(zzmp): Pass hash as the first argument.
      onTxFail: (error: Error, receipt: TransactionReceipt) => console.log('onTxFail'),
    }),
    []
  )

  return (
    <SwapWidget
      hideConnectionUI
      jsonRpcUrlMap={WIDGET_RPC_URLS}
      routerUrl={WIDGET_ROUTER_URL}
      width={WIDGET_WIDTH}
      locale={locale}
      theme={theme}
      provider={provider}
      settings={settings}
      value={value}
      {...swapHandlers}
      {...txHandlers}
    />
  )
}

function useWidgetTheme() {
  const darkMode = useIsDarkMode()
  return useMemo(() => (darkMode ? DARK_THEME : LIGHT_THEME), [darkMode])
}
