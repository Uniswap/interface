import { useSelectTransaction } from 'uniswap/src/features/transactions/hooks/useSelectTransaction'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

export function useCurrentFlashblocksTransaction(): TransactionDetails | undefined {
  const accountAddress = useWallet().evmAccount?.address

  const derivedSwapInfo = useSwapDependenciesStore((s) => s.derivedSwapInfo)
  const chainId = derivedSwapInfo.chainId

  const { txHash: storedTxHash, txId } = useSwapFormStore((s) => ({
    isConfirmed: s.isConfirmed,
    txHash: s.txHash,
    txId: s.txId,
  }))

  const transactionFromStateByHash = useSelectTransaction({
    address: accountAddress,
    chainId,
    txId: storedTxHash,
  })

  const transactionFromStateByTxId = useSelectTransaction({
    address: accountAddress,
    chainId,
    txId,
  })

  // as of 8/1/2024, the interface uses the tx hash as the key while the wallet uses the tx id (uuid)
  // we use a fallback to ensure this doesn't break on a refactor
  return transactionFromStateByHash || transactionFromStateByTxId
}
