import { injected, injectedHooks as hooks } from 'connectors'

import Option from './Option'

const { useChainId, useError, useIsActivating, useIsActive } = hooks

export default function MetaMaskCard() {
  const chainId = useChainId()
  const error = useError()
  const isActivating = useIsActivating()
  const isActive = useIsActive()

  return <Option connector={injected} chainId={chainId} isActivating={isActivating} error={error} isActive={isActive} />
}
