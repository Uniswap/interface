<<<<<<< HEAD
=======
import useActiveWeb3React from 'hooks/useActiveWeb3React'
<<<<<<< HEAD
>>>>>>> e52c73526b6a11445570f0ba8615a65dd7a6d840
=======
>>>>>>> dda30444410853fd4af8615ae92c116874673fa9
import { NEVER_RELOAD, useSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'

import { useArgentWalletDetectorContract } from './useContract'

export default function useIsArgentWallet(): boolean {
  const { account } = useActiveWeb3React()
  const argentWalletDetector = useArgentWalletDetectorContract()
  const inputs = useMemo(() => [account ?? undefined], [account])
  const call = useSingleCallResult(argentWalletDetector, 'isArgentWallet', inputs, NEVER_RELOAD)
  return call?.result?.[0] ?? false
}
