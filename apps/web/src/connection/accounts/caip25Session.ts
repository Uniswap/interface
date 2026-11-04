import { createContext, useContext, useMemo } from 'react'
import { CAIP25Session } from 'uniswap/src/features/capabilities/caip25/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  // oxlint-disable-next-line no-restricted-imports -- direct wagmi hooks needed for web wallet integration
  useAccount as useWagmiAccount,
  useCapabilities,
} from 'wagmi'
import { buildCAIP25Session } from '~/connection/accounts/buildCAIP25Session'

// Whether to advertise atomic batching in the CAIP-25 session is an app setting (one-click swap), which this
// store must not read directly; the app passes it in so the store stays below `state/`.
export const IncludeAtomicCapabilityContext = createContext(false)

export function useCAIP25Session(): CAIP25Session {
  const { data: capabilities } = useCapabilities()
  const { connector, address } = useWagmiAccount()
  const { chains: enabledChains } = useEnabledChains()
  const includeAtomicCapability = useContext(IncludeAtomicCapabilityContext)

  return useMemo(() => {
    return buildCAIP25Session({
      connector,
      address,
      capabilities,
      enabledChains,
      includeAtomicCapability,
    })
  }, [capabilities, connector, address, enabledChains, includeAtomicCapability])
}
