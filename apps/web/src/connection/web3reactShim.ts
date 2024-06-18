import { ChainId } from '@taraswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import { useMemo } from 'react'

// eslint-disable-next-line import/no-unused-modules -- shim is used via a build alias in craco.config.cjs
export function useWeb3React() {
  const account = useAccount()
  const provider = useEthersProvider({ chainId: account.chainId })

  return useMemo(
    () => ({
      account: account.address,
      chainId: account.chainId ?? ChainId.MAINNET,
      provider,
    }),
    [account.address, account.chainId, provider]
  )
}
