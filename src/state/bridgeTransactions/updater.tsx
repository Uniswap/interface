import { useEffect } from 'react'
import { useBridgeService } from '../../contexts/BridgeServiceProvider'

export default function Updater(): null {
  const BridgeService = useBridgeService()

  useEffect(() => {
    if (!BridgeService) return
    const pendingTxListenerId = setInterval(BridgeService.pendingTxListener, 5000)
    const depositTxListenerId = setInterval(BridgeService.l2DepositsListener, 5000)
    const withdrawalTxListenerId = setInterval(BridgeService.updatePendingWithdrawals, 5000)

    return () => {
      clearInterval(pendingTxListenerId)
      clearInterval(depositTxListenerId)
      clearInterval(withdrawalTxListenerId)
    }
  }, [BridgeService])

  return null
}
