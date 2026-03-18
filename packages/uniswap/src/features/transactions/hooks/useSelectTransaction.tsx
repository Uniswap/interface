import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { makeSelectTransaction } from 'uniswap/src/features/transactions/selectors'
import {
  InterfaceTransactionDetails,
  TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export function useSelectTransaction({
  address,
  chainId,
  txId,
}: {
  address?: Address
  chainId?: UniverseChainId
  txId?: string
}): TransactionDetails | InterfaceTransactionDetails | undefined {
  const selectTransaction = useMemo(makeSelectTransaction, [])
  return useSelector((state: UniswapState) => selectTransaction(state, { address, chainId, txId }))
}
