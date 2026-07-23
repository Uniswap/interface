import { useMemo } from 'react'
import { useAccountListData } from 'wallet/src/features/accounts/useAccountListData'

interface AddressWithBalance {
  address: Address
  balance: number
}

export function useSortedAccountList(addresses: Address[]): AddressWithBalance[] {
  const { balancesByAddress } = useAccountListData({
    addresses,
  })

  return useMemo(() => {
    return addresses
      .map((address) => ({
        address,
        balance: balancesByAddress?.[address] ?? 0,
      }))
      .sort((a, b) => b.balance - a.balance)
  }, [addresses, balancesByAddress])
}
