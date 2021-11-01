import { Currency, CurrencyAmount, Ether } from '@uniswap/sdk-core'
import { useAppSelector } from 'src/app/hooks'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { ChainId } from 'src/constants/chains'

// Inspired by useEthBalances: https://github.com/Uniswap/interface/blob/main/src/state/wallet/hooks.ts
export function useActiveAccountEthBalance(chainId: ChainId): CurrencyAmount<Currency> | null {
  const tokenAddress = NULL_ADDRESS
  return useAppSelector((state) => {
    if (!state.wallet.activeAccount?.address) return null

    const balance =
      state.balances.byChainId?.[chainId]?.[tokenAddress][state.wallet.activeAccount?.address]
    if (!balance) return null

    return CurrencyAmount.fromRawAmount(Ether.onChain(chainId), balance.amount) ?? null
  })
}
