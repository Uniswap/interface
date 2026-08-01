import { useMemo } from 'react'
import { useWalletBalancesIncludeCategories } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import {
  selectTotalsByRequestedAddress,
  toEvmWallets,
  useGetWalletsBalancesQuery,
} from 'uniswap/src/data/rest/getWalletsBalances/getWalletsBalances'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useRestPortfolioValueModifiers } from 'uniswap/src/features/dataApi/balances/useRestPortfolioValueModifier'

export function useAccountListData({
  addresses,
  refetchInterval,
}: {
  addresses: Address[]
  refetchInterval?: number | false
}): {
  balancesByAddress: AddressTo<number | undefined> | undefined
  loading: boolean
  refetch: () => void
} {
  const { chains: chainIds } = useEnabledChains()
  const modifiers = useRestPortfolioValueModifiers(addresses)
  const includeCategories = useWalletBalancesIncludeCategories()

  const wallets = useMemo(() => toEvmWallets(addresses), [addresses])
  const select = useMemo(() => selectTotalsByRequestedAddress(addresses), [addresses])

  const { data, isLoading, isPlaceholderData, refetch } = useGetWalletsBalancesQuery({
    input: { wallets, chainIds, modifiers, includeCategories },
    enabled: addresses.length > 0,
    refetchInterval,
    select,
  })

  return {
    balancesByAddress: data,
    // isLoading (not isPending): an empty-address disabled query would otherwise report loading forever.
    // isPlaceholderData: a newly added address has no value in the retained prior response yet — show loading.
    loading: isLoading || isPlaceholderData,
    refetch,
  }
}

export function useAccountBalances({ addresses }: { addresses: Address[] }): {
  balances: number[]
  totalBalance: number
} {
  const { balancesByAddress } = useAccountListData({ addresses })

  const balances = useMemo(
    () =>
      addresses
        .map((address) => balancesByAddress?.[address])
        .filter((balance): balance is number => balance !== undefined),
    [addresses, balancesByAddress],
  )

  return {
    balances,
    totalBalance: balances.reduce((a, b) => a + b, 0),
  }
}
