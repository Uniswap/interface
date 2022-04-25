import { coinbaseWallet, coinbaseWalletHooks as hooks } from 'constants/connectors'
import { useEffect } from 'react'

import Option from './Option'

const { useChainId, useError, useIsActivating, useIsActive } = hooks

export default function CoinbaseWalletCard() {
  const chainId = useChainId()
  const error = useError()
  const isActivating = useIsActivating()
  const isActive = useIsActive()

  useEffect(() => {
    void coinbaseWallet.connectEagerly()
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
