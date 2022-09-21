import { SupportedChainId } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { useEffect, useState } from 'react'

export const useBulkEnsResolver = (address: string): string | undefined => {
  const [ensName, setEnsName] = useState<string | undefined>()

  useEffect(() => {
    const ensProvider = RPC_PROVIDERS[SupportedChainId.MAINNET]

    ensProvider
      .lookupAddress(address)
      .then((ensDomain) => setEnsName(ensDomain ?? undefined))
      .catch((e) => console.error(e))
  }, [address])

  return ensName
}

export default useBulkEnsResolver
