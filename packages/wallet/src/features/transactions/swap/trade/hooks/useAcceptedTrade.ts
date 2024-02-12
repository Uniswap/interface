import { useEffect, useState } from 'react'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { requireAcceptNewTrade } from 'wallet/src/features/transactions/swap/utils'

export function useAcceptedTrade({ derivedSwapInfo }: { derivedSwapInfo?: DerivedSwapInfo }): {
  onAcceptTrade: () => undefined
  acceptedDerivedSwapInfo?: DerivedSwapInfo
  newTradeRequiresAcceptance: boolean
} {
  const [acceptedDerivedSwapInfo, setAcceptedDerivedSwapInfo] = useState<DerivedSwapInfo>()

  const trade = derivedSwapInfo?.trade.trade
  const acceptedTrade = acceptedDerivedSwapInfo?.trade.trade

  const newTradeRequiresAcceptance = requireAcceptNewTrade(acceptedTrade, trade)

  useEffect(() => {
    if (!trade || trade === acceptedTrade) {
      return
    }

    // auto-accept: 1) first valid trade for the user or 2) new trade if price movement is below threshold
    if (!acceptedTrade || !newTradeRequiresAcceptance) {
      setAcceptedDerivedSwapInfo(derivedSwapInfo)
    }
  }, [trade, acceptedTrade, newTradeRequiresAcceptance, derivedSwapInfo])

  const onAcceptTrade = (): undefined => {
    if (!trade) {
      return undefined
    }

    setAcceptedDerivedSwapInfo(derivedSwapInfo)
  }

  return {
    onAcceptTrade,
    acceptedDerivedSwapInfo,
    newTradeRequiresAcceptance,
  }
}
