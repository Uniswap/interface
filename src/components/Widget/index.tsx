import { Currency, SwapWidget } from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import { RPC_URLS } from 'constants/networks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useMemo } from 'react'
import { useIsDarkMode } from 'state/user/hooks'
import { DARK_THEME, LIGHT_THEME } from 'theme/widget'

import { useSyncWidgetInputs } from './inputs'
import { useSyncWidgetSettings } from './settings'
import { useSyncWidgetTransactions } from './transactions'

export const WIDGET_WIDTH = 320

const WIDGET_ROUTER_URL = 'https://api.uniswap.org/v1/'

export interface WidgetProps {
  defaultToken?: Currency
}

export default function Widget({ defaultToken }: WidgetProps) {
  const locale = useActiveLocale()
  const darkMode = useIsDarkMode()
  const theme = useMemo(() => (darkMode ? DARK_THEME : LIGHT_THEME), [darkMode])
  const { provider } = useWeb3React()

  const { inputs, tokenSelector } = useSyncWidgetInputs(defaultToken)
  const { settings } = useSyncWidgetSettings()
  const { transactions } = useSyncWidgetTransactions()

  return (
    <>
      <SwapWidget
        disableBranding
        hideConnectionUI
        jsonRpcUrlMap={RPC_URLS}
        routerUrl={WIDGET_ROUTER_URL}
        width={WIDGET_WIDTH}
        locale={locale}
        theme={theme}
        // defaultChainId is excluded - it is always inferred from the passed provider
        provider={provider}
        {...inputs}
        {...settings}
        {...transactions}
      />
      {tokenSelector}
    </>
  )
}
