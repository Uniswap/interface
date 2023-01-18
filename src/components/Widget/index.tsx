import { Currency } from '@uniswap/sdk-core'
import {
  AddEthereumChainParameter,
  EMPTY_TOKEN_LIST,
  OnReviewSwapClick,
  SwapWidget,
  SwapWidgetSkeleton,
} from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import { usePermit2Enabled } from 'featureFlags/flags/permit2'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useCallback } from 'react'
import { useIsDarkMode } from 'state/user/hooks'
import { switchChain } from 'utils/switchChain'

import { useSyncWidgetInputs } from './inputs'
import { useSyncWidgetSettings } from './settings'
import { DARK_THEME, LIGHT_THEME } from './theme'
import { useSyncWidgetTransactions } from './transactions'

export const WIDGET_WIDTH = 360

const WIDGET_ROUTER_URL = 'https://api.uniswap.org/v1/'

function useWidgetTheme() {
  return useIsDarkMode() ? DARK_THEME : LIGHT_THEME
}

interface WidgetProps {
  token?: Currency
  onTokenChange?: (token: Currency) => void
  onReviewSwapClick?: OnReviewSwapClick
}

export default function Widget({ token, onTokenChange, onReviewSwapClick }: WidgetProps) {
  const { connector, provider } = useWeb3React()
  const locale = useActiveLocale()
  const theme = useWidgetTheme()
  const { inputs, tokenSelector } = useSyncWidgetInputs({ token, onTokenChange })
  const { settings } = useSyncWidgetSettings()
  const { transactions } = useSyncWidgetTransactions()

  const onSwitchChain = useCallback(
    // TODO(WEB-1757): Widget should not break if this rejects - upstream the catch to ignore it.
    ({ chainId }: AddEthereumChainParameter) => switchChain(connector, Number(chainId)).catch(() => undefined),
    [connector]
  )

  const onApproveToken = useCallback(() => {
    const input = inputs.value.INPUT
    if (!input) return
  }, [inputs.value.INPUT])

  const permit2Enabled = usePermit2Enabled()

  if (!(inputs.value.INPUT || inputs.value.OUTPUT)) {
    return <WidgetSkeleton />
  }

  return (
    <>
      <SwapWidget
        hideConnectionUI
        brandedFooter={false}
        permit2={permit2Enabled}
        routerUrl={WIDGET_ROUTER_URL}
        locale={locale}
        theme={theme}
        width={WIDGET_WIDTH}
        // defaultChainId is excluded - it is always inferred from the passed provider
        provider={provider}
        onSwitchChain={onSwitchChain}
        tokenList={EMPTY_TOKEN_LIST} // prevents loading the default token list, as we use our own token selector UI
        {...inputs}
        {...settings}
        {...transactions}
        onReviewSwapClick={onReviewSwapClick}
        onSwapApprove={onApproveToken}
      />
      {tokenSelector}
    </>
  )
}

export function WidgetSkeleton() {
  const theme = useWidgetTheme()
  return <SwapWidgetSkeleton theme={theme} width={WIDGET_WIDTH} />
}
