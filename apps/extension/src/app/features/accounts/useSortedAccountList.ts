import { useMemo } from 'react'
import { usePrevious } from 'utilities/src/react/hooks'
import { useAccountListData } from 'wallet/src/features/accounts/useAccountListData'

interface AddressWithBalance {
  address: Address
  balance: number
}

export function useSortedAccountList(addresses: Address[]): AddressWithBalance[] {
  const { data: accountBalanceData } = useAccountListData({
    addresses,
  })

  /* 
  Why are we using previousAccountBalanceData?

  This is a workaround for a data fetching inefficiency. When removing an address, we send a new query 
  with the updated address array, causing Apollo to refetch ALL balances. During this refetch, balances 
  temporarily show as 0, causing the list to re-sort momentarily.
  
  We use previousAccountBalanceData to maintain the last known good balances during this refetch. The balances 
  will be updated once the new query completes.
  */
  const previousAccountBalanceData = usePrevious(accountBalanceData)

  const balanceRecord: Record<Address, number> = useMemo(() => {
    const data = accountBalanceData || previousAccountBalanceData
    if (!data?.portfolios) {
      return {}
    }
    return Object.fromEntries(
      data.portfolios
        .filter((portfolio): portfolio is NonNullable<typeof portfolio> => Boolean(portfolio))
        .map((portfolio) => [portfolio.ownerAddress, portfolio.tokensTotalDenominatedValue?.value ?? 0]),
    )
  }, [accountBalanceData, previousAccountBalanceData])

  return useMemo(() => {
    return addresses
      .map((address) => ({
        address,
        balance: balanceRecord[address] ?? 0,
      }))
      .sort((a, b) => b.balance - a.balance)
  }, [addresses, balanceRecord])
}
