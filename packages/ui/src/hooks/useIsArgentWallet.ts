import { NEVER_RELOAD, useSingleCallResult } from '../state/multicall/hooks'
import { useActiveWeb3React } from './index'
import { useArgentWalletDetectorContract } from './useContract'

export default function useIsArgentWallet(): boolean {
  const { account } = useActiveWeb3React()
  const argentWalletDetector = useArgentWalletDetectorContract()
  const call = useSingleCallResult(argentWalletDetector, 'isArgentWallet', [account ?? undefined], NEVER_RELOAD)
  return call?.result?.[0] ?? false
}
