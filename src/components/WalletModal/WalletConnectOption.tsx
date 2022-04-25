import { useEffect } from 'react'
import { walletConnect, walletConnectHooks as hooks } from 'constants/connectors'

import Option from './Option'

const { useChainId, useError, useIsActivating, useIsActive } = hooks

export default function WalletConnectCard() {
  const chainId = useChainId()
  const accounts = useAccounts()
  const error = useError()
  const isActivating = useIsActivating()
  const isActive = useIsActive()

  useEffect(() => {
    void walletConnect.connectEagerly()
  }, [])

  return (
    <Option
      connector={coinbaseWallet}
      chainId={chainId}
      isActivating={isActivating}
      error={error}
      isActive={isActive}
    />
  )
}
