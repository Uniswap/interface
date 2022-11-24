import { AnchorProvider } from '@project-serum/anchor'
import { useAnchorWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'

import connection from 'state/connection/connection'

const useProvider = (): AnchorProvider | null => {
  const wallet = useAnchorWallet()

  const provider = useMemo(
    () => (wallet ? new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions()) : null),
    [wallet],
  )
  return provider
}

export default useProvider
