import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { assume0xAddress, type Hash } from '~/chains'
import { useAccount } from '~/connection/hooks/useAccount'
import { useMerkleDistributorContract } from '~/features/wallet/claim/hooks/useMerkleDistributorContract'
import { useUserClaimData } from '~/features/wallet/claim/hooks/useUserClaimData'
import { useUserUnclaimedAmount } from '~/features/wallet/claim/hooks/useUserUnclaimedAmount'
import { useTransactionAdderFromHash } from '~/state/transactions/adder'

export function useClaimCallback(address: string | null | undefined): {
  claimCallback: () => Promise<string | undefined>
} {
  // get claim data for this account
  const account = useAccount()
  const claimData = useUserClaimData(address)

  // used for popup summary
  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(address)
  const addTransaction = useTransactionAdderFromHash()
  const distributorContract = useMerkleDistributorContract()

  const claimCallback = async function (): Promise<string | undefined> {
    // `account.address` gates on a connected wallet (the seam attaches a signer
    // only when it's present), so `write.claim` always has signing capability.
    if (!claimData || !address || !account.chainId || !account.address || !distributorContract) {
      return undefined
    }

    const hash = await distributorContract.write.claim([
      BigInt(claimData.index),
      assume0xAddress(address),
      BigInt(claimData.amount),
      claimData.proof as Hash[],
    ])
    addTransaction(
      { hash, chainId: account.chainId },
      {
        type: TransactionType.ClaimUni,
        recipient: address,
        uniAmountRaw: unclaimedAmount?.quotient.toString(),
      },
    )
    return hash
  }

  return { claimCallback }
}
