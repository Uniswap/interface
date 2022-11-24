import { Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useTokenContractForReading } from 'hooks/useContract'
import { useSingleCallResult } from 'state/multicall/hooks'

export function useTokenAllowance(token?: Token, owner?: string, spender?: string): TokenAmount | undefined {
  const { isEVM } = useActiveWeb3React()
  const contractForReading = useTokenContractForReading(isEVM ? token?.address : undefined)

  const inputs = useMemo(() => [owner, spender], [owner, spender])
  const allowance = useSingleCallResult(contractForReading, 'allowance', inputs).result

  return useMemo(
    () => (token && allowance ? TokenAmount.fromRawAmount(token, allowance.toString()) : undefined),
    [token, allowance],
  )
}
