import { coinbaseWallet, coinbaseWalletHooks as hooks } from 'connectors'

import Option from './Option'

const { useChainId, useError, useIsActivating, useIsActive } = hooks

export default function CoinbaseWalletCard() {
  const chainId = useChainId()
  const error = useError()
  const isActivating = useIsActivating()
  const isActive = useIsActive()

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
