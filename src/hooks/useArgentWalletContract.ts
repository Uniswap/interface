import { ArgentWalletContract } from '../abis/types'
import { useActiveWeb3React } from './web3'
import { useContract } from './useContract'
import useIsArgentWallet from './useIsArgentWallet'
import ArgentWalletContractABI from '../abis/argent-wallet-contract.json'

export function useArgentWalletContract(): ArgentWalletContract | null {
  const { account } = useActiveWeb3React()
  const isArgentWallet = useIsArgentWallet()
  return useContract(
    isArgentWallet ? account ?? undefined : undefined,
    ArgentWalletContractABI,
    true
  ) as ArgentWalletContract
}
