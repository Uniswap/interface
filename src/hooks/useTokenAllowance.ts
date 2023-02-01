import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useTokenContract } from 'hooks/useContract'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useEffect, useMemo, useState } from 'react'

export function useTokenAllowance(
  token?: Token,
  owner?: string,
  spender?: string
): {
  tokenAllowance: CurrencyAmount<Token> | undefined
  isSyncing: boolean
} {
  const contract = useTokenContract(token?.address, false)
  const inputs = useMemo(() => [owner, spender], [owner, spender])

  // If there is no allowance yet, re-check next observed block.
  // This guarantees that the tokenAllowance is marked isSyncing upon approval and updated upon being synced.
  const [blocksPerFetch, setBlocksPerFetch] = useState<1>()
  const { result, syncing: isSyncing } = useSingleCallResult(contract, 'allowance', inputs, { blocksPerFetch }) as {
    result: Awaited<ReturnType<NonNullable<typeof contract>['allowance']>> | undefined
    syncing: boolean
  }

  const rawAmount = result?.toString() // convert to a string before using in a hook, to avoid spurious rerenders
  const allowance = useMemo(
    () => (token && rawAmount ? CurrencyAmount.fromRawAmount(token, rawAmount) : undefined),
    [token, rawAmount]
  )
  useEffect(() => setBlocksPerFetch(allowance?.equalTo(0) ? 1 : undefined), [allowance])

  return useMemo(() => ({ tokenAllowance: allowance, isSyncing }), [allowance, isSyncing])
}
