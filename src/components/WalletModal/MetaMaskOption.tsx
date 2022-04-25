import { injected, injectedHooks as hooks } from 'connectors'
import { useEffect } from 'react'

import Option from './Option'

const { useChainId, useError, useIsActivating, useIsActive } = hooks

export default function MetaMaskCard() {
  const chainId = useChainId()
  const error = useError()
  const isActivating = useIsActivating()
  const isActive = useIsActive()

  useEffect(() => {
    void injected.connectEagerly()
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
