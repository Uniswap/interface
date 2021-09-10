import { useMemo } from 'react'
import { useSWPRConverterContract } from '../useContract'
import { TransactionResponse } from '@ethersproject/providers'

/**
 * Returns a function that creates a liquidity mining distribution with the given parameters.
 */
export function useConvertSwprCallback(account?: string): null | (() => Promise<TransactionResponse>) {
  const contract = useSWPRConverterContract(true)

  return useMemo(() => {
    if (!contract || !account) return null
    return async () => {
      return contract.convert(account)
    }
  }, [account, contract])
}
