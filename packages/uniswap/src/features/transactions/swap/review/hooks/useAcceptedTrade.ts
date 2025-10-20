import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { requireAcceptNewTrade } from 'uniswap/src/features/transactions/swap/utils/trade'
import { interruptTransactionFlow } from 'uniswap/src/utils/saga'
import { isWebApp } from 'utilities/src/platform'

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

  // Avoid prompting user to accept new trade if submission is in progress
  const newTradeRequiresAcceptance = !avoidPromptingUserToAcceptNewTrade && requireAcceptNewTrade(acceptedTrade, trade)

  useEffect(() => {
    if ((!trade && !indicativeTrade) || trade === acceptedTrade) {
      return
    }

    // auto-accept: 1) first valid trade for the user or 2) new trade if price movement is below threshold
    if (!acceptedTrade || !newTradeRequiresAcceptance) {
      setAcceptedDerivedSwapInfo(derivedSwapInfo)
    }

    // If a new trade requires acceptance, interrupt interface's transaction flow
    if (isWebApp && newTradeRequiresAcceptance) {
      dispatch(interruptTransactionFlow())
    }
  }, [trade, acceptedTrade, indicativeTrade, newTradeRequiresAcceptance, derivedSwapInfo, dispatch])

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
