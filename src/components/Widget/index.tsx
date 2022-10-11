// Import fonts.css for the side-effect of loading fonts for @uniswap/widgets.
// eslint-disable-next-line no-restricted-imports
import '@uniswap/widgets/dist/fonts.css'

import { Currency, EMPTY_TOKEN_LIST, OnReviewSwapClick, SwapWidget, SwapWidgetSkeleton } from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import { networkConnection } from 'connection'
import { RPC_PROVIDERS } from 'constants/providers'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useIsDarkMode } from 'state/user/hooks'
import { DARK_THEME, LIGHT_THEME } from 'theme/widget'

import { useSyncWidgetInputs } from './inputs'
import { useSyncWidgetSettings } from './settings'
import { useSyncWidgetTransactions } from './transactions'

export const WIDGET_WIDTH = 360

const WIDGET_ROUTER_URL = 'https://api.uniswap.org/v1/'

export interface WidgetProps {
  defaultToken?: Currency
  onReviewSwapClick?: OnReviewSwapClick
}

export default function Widget({ defaultToken, onReviewSwapClick }: WidgetProps) {
  const locale = useActiveLocale()
  const theme = useIsDarkMode() ? DARK_THEME : LIGHT_THEME
  const { connector, provider } = useWeb3React()

  const { inputs, tokenSelector } = useSyncWidgetInputs(defaultToken)
  const { settings } = useSyncWidgetSettings()
  const { transactions } = useSyncWidgetTransactions()

  return (
    <>
      <SwapWidget
        disableBranding
        hideConnectionUI
        jsonRpcUrlMap={RPC_PROVIDERS}
        routerUrl={WIDGET_ROUTER_URL}
        width={WIDGET_WIDTH}
        locale={locale}
        theme={theme}
        onReviewSwapClick={onReviewSwapClick}
        // defaultChainId is excluded - it is always inferred from the passed provider
        provider={connector === networkConnection.connector ? null : provider} // use jsonRpcUrlMap for network providers
        tokenList={EMPTY_TOKEN_LIST} // prevents loading the default token list, as we use our own token selector UI
        {...inputs}
        {...settings}
        {...transactions}
      />
      {tokenSelector}
    </>
  )
}

export function WidgetSkeleton() {
  return <SwapWidgetSkeleton theme={useIsDarkMode() ? DARK_THEME : LIGHT_THEME} width={WIDGET_WIDTH} />
}
