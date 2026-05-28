import { useContext } from 'react'
import { useAccount } from '~/hooks/useAccount'
import { MultichainContext } from '~/state/multichain/types'

export function useMultichainContext() {
  const account = useAccount()
  const context = useContext(MultichainContext)
  // Certain components are used both inside the swap/limit/send surfaces and outside of them
  // (e.g. add/remove liquidity, pool finder). In those cases we want the chainId from the
  // connected account (hooks/useAccount), not the multichain swap UI chainId.
  return {
    ...context,
    chainId: context.isMultichainContext ? context.chainId : account.chainId,
  }
}
