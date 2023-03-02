import { AnchorProvider } from '@project-serum/anchor'
import { useAnchorWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'

import { useWeb3Solana } from 'hooks'

const useProvider = (): AnchorProvider | null => {
  const wallet = useAnchorWallet()
  const { connection } = useWeb3Solana()

  const provider = useMemo(
    () => (wallet && connection ? new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions()) : null),
    [wallet, connection],
  )
  return provider
}

export default useProvider
