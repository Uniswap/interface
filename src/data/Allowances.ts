import { useContractKit } from '@celo-tools/use-contractkit'
import { Token, TokenAmount } from '@ubeswap/sdk'
import { useAsyncState } from 'hooks/useAsyncState'
import { useCallback, useMemo } from 'react'
import { AbiItem } from 'web3-utils'

import ERC20_ABI from '../constants/abis/erc20.json'

export function useTokenAllowance(
  token?: Token,
  owner?: string,
  spender?: string
): [TokenAmount | undefined, () => void] {
  const { kit } = useContractKit()

  const call = useCallback(async () => {
    const tokenContract = new kit.web3.eth.Contract(ERC20_ABI as AbiItem[], token?.address)
    return await tokenContract.methods.allowance(owner, spender).call()
  }, [owner, spender, token, kit])
  const [allowance, refetchAllowance] = useAsyncState('0', call)

  return useMemo(
    () => [token && allowance ? new TokenAmount(token, allowance.toString()) : undefined, refetchAllowance],
    [token, allowance, refetchAllowance]
  )
}
