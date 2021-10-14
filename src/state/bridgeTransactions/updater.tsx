import { useEffect } from 'react'
import { useBridgeService } from '../../contexts/BridgeServiceProvider'

const BRIDGE_UPDATER_INTERVAL = 5000

export default function Updater(): null {
  const bridgeService = useBridgeService()

  useEffect(() => {
    if (!bridgeService) return
    const pendingTxListenerId = setInterval(bridgeService.pendingTxListener, BRIDGE_UPDATER_INTERVAL)
    const depositTxListenerId = setInterval(bridgeService.l2DepositsListener, BRIDGE_UPDATER_INTERVAL)
    const withdrawalTxListenerId = setInterval(bridgeService.updatePendingWithdrawals, BRIDGE_UPDATER_INTERVAL)

    return () => {
      clearInterval(pendingTxListenerId)
      clearInterval(depositTxListenerId)
      clearInterval(withdrawalTxListenerId)
    }
  }, [bridgeService])

  return null
}
