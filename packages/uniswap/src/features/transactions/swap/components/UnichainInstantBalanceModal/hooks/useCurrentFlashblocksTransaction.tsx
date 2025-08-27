import { useSelectTransaction } from 'uniswap/src/features/transactions/hooks/useSelectTransaction'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import {
  InterfaceTransactionDetails,
  TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

export function useCurrentFlashblocksTransaction(): TransactionDetails | InterfaceTransactionDetails | undefined {
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

  // UniswapX transactions are stored by tx id while classic swaps are stored by tx hash
  return transactionFromStateByHash || transactionFromStateByTxId
}
