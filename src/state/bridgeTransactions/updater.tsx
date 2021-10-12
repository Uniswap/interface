import { useEffect } from 'react'
import { useBridgeService } from '../../contexts/BridgeServiceProvider'

export default function Updater(): null {
  const bridgeService = useBridgeService()

  useEffect(() => {
    if (!bridgeService) return
    const pendingTxListenerId = setInterval(bridgeService.pendingTxListener, 5000)
    const depositTxListenerId = setInterval(bridgeService.l2DepositsListener, 5000)
    const withdrawalTxListenerId = setInterval(bridgeService.updatePendingWithdrawals, 5000)

    return () => {
      clearInterval(pendingTxListenerId)
      clearInterval(depositTxListenerId)
      clearInterval(withdrawalTxListenerId)
    }
  }, [bridgeService])

  return null
}
