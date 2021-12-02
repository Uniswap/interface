import ArgentWalletContractABI from '../abis/argent-wallet-contract.json'
import { ArgentWalletContract } from '../abis/types'
import { useContract } from './useContract'
import useIsArgentWallet from './useIsArgentWallet'
import { useActiveWeb3React } from './web3'

export function useArgentWalletContract(): ArgentWalletContract | null {
  const { account } = useActiveWeb3React()
  const isArgentWallet = useIsArgentWallet()
  return useContract(
    isArgentWallet ? account ?? undefined : undefined,
    ArgentWalletContractABI,
    true
  ) as ArgentWalletContract
}
