import { Percent } from '@uniswap/sdk-core'
import { Slippage, SwapEventHandlers, SwapSettingsController } from '@uniswap/widgets'
import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import { useCallback, useMemo, useState } from 'react'
import { useSetUserSlippageTolerance, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'

// Integrates the Widget's settings, keeping the widget and app settings in sync.
export function useSyncWidgetSettings() {
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

  return { settings: { settings, ...settingsHandlers } }
}
