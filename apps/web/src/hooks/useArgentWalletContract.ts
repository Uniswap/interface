import { useAccount } from 'hooks/useAccount'
import { useContract } from 'hooks/useContract'
import useIsArgentWallet from 'hooks/useIsArgentWallet'
import ArgentWalletContractABI from 'uniswap/src/abis/argent-wallet-contract.json'
import { ArgentWalletContract } from 'uniswap/src/abis/types'

export function useArgentWalletContract(): ArgentWalletContract | null {
  const account = useAccount()
  const isArgentWallet = useIsArgentWallet()
  return useContract(
    isArgentWallet ? account.address : undefined,
    ArgentWalletContractABI,
    true,
  ) as ArgentWalletContract
}
