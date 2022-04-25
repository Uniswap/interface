import { walletConnect, walletConnectHooks as hooks } from 'connectors'
import { useEffect } from 'react'

import Option from './Option'

const { useChainId, useError, useIsActivating, useIsActive } = hooks

export default function WalletConnectCard() {
  const chainId = useChainId()
  const error = useError()
  const isActivating = useIsActivating()
  const isActive = useIsActive()

  useEffect(() => {
    void walletConnect.connectEagerly()
  }, [])

  return (
    <Option connector={walletConnect} chainId={chainId} isActivating={isActivating} error={error} isActive={isActive} />
  )
}
