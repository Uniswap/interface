import { useMemo } from 'react'

import { NEVER_RELOAD, useSingleCallResult } from '../state/multicall/hooks'
import { useArgentWalletDetectorContract } from './useContract'
import useActiveWeb3React from 'hooks/useActiveWeb3React'

export default function useIsArgentWallet(): boolean {
  const { account } = useActiveWeb3React()
  const argentWalletDetector = useArgentWalletDetectorContract()
  const inputs = useMemo(() => [account ?? undefined], [account])
  const call = useSingleCallResult(argentWalletDetector, 'isArgentWallet', inputs, NEVER_RELOAD)
  return call?.result?.[0] ?? false
}
