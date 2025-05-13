import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { OnchainItemListOptionType, WalletOption } from 'uniswap/src/components/lists/items/types'
import { selectWatchedAddressSet } from 'uniswap/src/features/favorites/selectors'

export function useFavoriteWalletOptions({ skip }: { skip?: boolean }): WalletOption[] | undefined {
  const favoriteWalletsSet = useSelector(selectWatchedAddressSet)

  return useMemo(() => {
    if (skip) {
      return undefined
    }

    // Since we only save address in search history, we push these as OnchainItemListOptionType.WalletByAddress.
    // Inside WalletByAddressOptionItem, we check if the associated wallet actually has an ENS/Unitag name, and display accordingly
    return Array.from(favoriteWalletsSet).map((address) => ({
      type: OnchainItemListOptionType.WalletByAddress,
      address,
    }))
  }, [favoriteWalletsSet, skip])
}
