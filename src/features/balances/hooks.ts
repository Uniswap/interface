import { useAppSelector } from 'src/app/hooks'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { ChainId } from 'src/constants/chains'
import { Balance } from 'src/features/balances/types'

export function useActiveAccountEthBalance(chainId: ChainId): Balance | null {
  const tokenAddress = NULL_ADDRESS
  return useAppSelector((state) => {
    if (!state.wallet.activeAccount?.address) return null
    return (
      state.balances.byChainId?.[chainId]?.[tokenAddress][state.wallet.activeAccount?.address] ??
      null
    )
  })
}
