import { Percent } from '@uniswap/sdk-core'
import { Slippage, SwapController, SwapEventHandlers } from '@uniswap/widgets'
import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import { useCallback, useMemo, useState } from 'react'
import { useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'

/**
 * Integrates the Widget's settings, keeping the widget and app settings in sync.
 * NB: This acts as an integration layer, so certain values are duplicated in order to translate
 * between app and widget representations.
 */
export function useSyncWidgetSettings() {
  const [appTtl, setAppTtl] = useUserTransactionTTL()
  const [widgetTtl, setWidgetTtl] = useState<number | undefined>(appTtl / 60)
  const onTransactionDeadlineChange = useCallback(
    (widgetTtl: number | undefined) => {
      setWidgetTtl(widgetTtl)
      const appTtl = widgetTtl === undefined ? widgetTtl : widgetTtl * 60
      setAppTtl(appTtl ?? DEFAULT_DEADLINE_FROM_NOW)
    },
    [setAppTtl]
  )

  const [appSlippage, setAppSlippage] = useUserSlippageTolerance()
  const [widgetSlippage, setWidgetSlippage] = useState<string | undefined>(
    appSlippage === 'auto' ? undefined : appSlippage.toFixed(2)
  )
  const onSlippageChange = useCallback(
    (widgetSlippage: Slippage) => {
      setWidgetSlippage(widgetSlippage.max)
      if (widgetSlippage.auto || !widgetSlippage.max) {
        setAppSlippage('auto')
      } else {
        setAppSlippage(new Percent(Math.floor(Number(widgetSlippage.max) * 100), 10_000))
      }
    },
    [setAppSlippage]
  )

  const onSettingsReset = useCallback(() => {
    setWidgetTtl(undefined)
    setAppTtl(DEFAULT_DEADLINE_FROM_NOW)
    setWidgetSlippage(undefined)
    setAppSlippage('auto')
  }, [setAppSlippage, setAppTtl])

  const settings: SwapController['settings'] = useMemo(() => {
    const auto = appSlippage === 'auto'
    return { slippage: { auto, max: widgetSlippage }, transactionTtl: widgetTtl }
  }, [widgetSlippage, widgetTtl, appSlippage])
  const settingsHandlers: SwapEventHandlers = useMemo(
    () => ({ onSettingsReset, onSlippageChange, onTransactionDeadlineChange }),
    [onSettingsReset, onSlippageChange, onTransactionDeadlineChange]
  )

  return { settings: { settings, ...settingsHandlers } }
}
