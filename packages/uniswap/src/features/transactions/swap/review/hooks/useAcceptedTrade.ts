import { isWebApp } from '@universe/environment'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { requireAcceptNewTrade } from 'uniswap/src/features/transactions/swap/utils/trade'
import { interruptTransactionFlow } from 'uniswap/src/utils/saga'

export function useAcceptedTrade({
  derivedSwapInfo,
  isSubmitting,
}: {
  derivedSwapInfo?: DerivedSwapInfo
  isSubmitting: boolean
}): {
  onAcceptTrade: () => undefined
  acceptedDerivedSwapInfo?: DerivedSwapInfo
  newTradeRequiresAcceptance: boolean
} {
  const [acceptedDerivedSwapInfo, setAcceptedDerivedSwapInfo] = useState<DerivedSwapInfo>()
  const dispatch = useDispatch()

  const { trade, indicativeTrade } = derivedSwapInfo?.trade ?? {}
  const acceptedTrade = acceptedDerivedSwapInfo?.trade.trade

  // In wallet, once swap is clicked / submission is in progress, it is too late to prompt user to accept new trade.
  // On interface, we can prompt the user to accept a new trade mid-flow.
  const avoidPromptingUserToAcceptNewTrade = isSubmitting && !isWebApp

  // Avoid prompting user to accept new trade if submission is in progress.
  // Earn-intent changes (toggling the deposit on/off) intentionally do NOT bypass this check: the
  // re-quote auto-accepts only when the price is within threshold, and prompts when it moved materially.
  const newTradeRequiresAcceptance = !avoidPromptingUserToAcceptNewTrade && requireAcceptNewTrade(acceptedTrade, trade)
  const earnIntentChanged = getEarnIntentKey(acceptedTrade) !== getEarnIntentKey(trade)

  useEffect(() => {
    if ((!trade && !indicativeTrade) || trade === acceptedTrade) {
      return
    }

    // If a new trade requires acceptance, interrupt interface's transaction flow
    if (isWebApp && newTradeRequiresAcceptance && !earnIntentChanged) {
      dispatch(interruptTransactionFlow())
    }

    // Avoid updating the accepted trade if submission is in progress
    if (isSubmitting) {
      return
    }

    // auto-accept: 1) first valid trade for the user or 2) new trade if price movement is below threshold
    if (!acceptedTrade || !newTradeRequiresAcceptance) {
      setAcceptedDerivedSwapInfo(derivedSwapInfo)
    }
  }, [
    trade,
    acceptedTrade,
    indicativeTrade,
    newTradeRequiresAcceptance,
    earnIntentChanged,
    derivedSwapInfo,
    dispatch,
    isSubmitting,
  ])

  const onAcceptTrade = (): undefined => {
    if (!trade) {
      return
    }

    setAcceptedDerivedSwapInfo(derivedSwapInfo)
  }

  return {
    onAcceptTrade,
    acceptedDerivedSwapInfo,
    newTradeRequiresAcceptance,
  }
}

function getEarnIntentKey(trade: Maybe<Trade>): string | undefined {
  if (!trade || !('earnIntent' in trade) || !trade.earnIntent) {
    return undefined
  }

  return `${trade.earnIntent.action}:${trade.earnIntent.chainId}:${trade.earnIntent.vault}`
}
