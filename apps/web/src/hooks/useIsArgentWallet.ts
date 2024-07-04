import { useAccount } from 'hooks/useAccount'
import { useArgentWalletDetectorContract } from 'hooks/useContract'
import { NEVER_RELOAD, useSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'

export default function useIsArgentWallet(): boolean {
  const account = useAccount()
  const argentWalletDetector = useArgentWalletDetectorContract()
  const inputs = useMemo(() => [account.address], [account.address])
  const call = useSingleCallResult(argentWalletDetector, 'isArgentWallet', inputs, NEVER_RELOAD)
  return Boolean(call?.result?.[0])
}
