import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { Percent } from '@uniswap/sdk-core'
import { Currency, Field, Slippage, SwapEventHandlers, SwapSettingsController, SwapWidget } from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import { RPC_URLS } from 'constants/networks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useCallback, useMemo, useState } from 'react'
import {
  useIsDarkMode,
  useSetUserSlippageTolerance,
  useUserSlippageTolerance,
  useUserTransactionTTL,
} from 'state/user/hooks'
import { DARK_THEME, LIGHT_THEME } from 'theme/widget'

export const WIDGET_WIDTH = 320

const WIDGET_ROUTER_URL = 'https://api.uniswap.org/v1/'

export default function Widget() {
  const locale = useActiveLocale()
  const theme = useWidgetTheme()
  const { provider } = useWeb3React()

  const [userTtl, setUserTtl] = useUserTransactionTTL()
  const [ttl, setTtl] = useState<number | undefined>(userTtl / 60)
  const onTransactionDeadlineChange = useCallback(
    (ttl: number | undefined) => {
      setTtl(ttl)
      const userTtl = ttl === undefined ? ttl : ttl * 60
      setUserTtl(userTtl ?? DEFAULT_DEADLINE_FROM_NOW)
    },
    [setUserTtl]
  )
  const [userSlippage, setUserSlippage] = [useUserSlippageTolerance(), useSetUserSlippageTolerance()]
  const [slippage, setSlippage] = useState<string | undefined>(
    userSlippage === 'auto' ? undefined : userSlippage.toFixed(2)
  )
  const onSlippageChange = useCallback(
    (slippage: Slippage) => {
      setSlippage(slippage.max)
      if (slippage.auto || !slippage.max) {
        setUserSlippage('auto')
      } else {
        setUserSlippage(new Percent(Math.floor(Number(slippage.max) * 100), 10_000))
      }
    },
    [setUserSlippage]
  )
  const onSettingsReset = useCallback(() => {
    setTtl(undefined)
    setUserTtl(DEFAULT_DEADLINE_FROM_NOW)
    setSlippage(undefined)
    setUserSlippage('auto')
  }, [setUserSlippage, setUserTtl])
  const settings: SwapSettingsController = useMemo(() => {
    const auto = userSlippage === 'auto'
    return { slippage: { auto, max: slippage }, transactionTtl: ttl }
  }, [slippage, ttl, userSlippage])
  const settingsHandlers: SwapEventHandlers = useMemo(
    () => ({ onSettingsReset, onSlippageChange, onTransactionDeadlineChange }),
    [onSettingsReset, onSlippageChange, onTransactionDeadlineChange]
  )

  const value /*: SwapController */ = useMemo(() => ({}), [])
  const valueHandlers /*: SwapEventHandlers */ = useMemo(
    () => ({
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
      onTxFail: (hash: string, receipt: TransactionReceipt) => console.log('onTxFail'),
    }),
    []
  )

  return (
    <SwapWidget
      hideConnectionUI
      jsonRpcUrlMap={RPC_URLS}
      routerUrl={WIDGET_ROUTER_URL}
      width={WIDGET_WIDTH}
      locale={locale}
      theme={theme}
      provider={provider}
      {...txHandlers}
      settings={settings}
      {...settingsHandlers}
      value={value}
      {...valueHandlers}
    />
  )
}

function useWidgetTheme() {
  const darkMode = useIsDarkMode()
  return useMemo(() => (darkMode ? DARK_THEME : LIGHT_THEME), [darkMode])
}
