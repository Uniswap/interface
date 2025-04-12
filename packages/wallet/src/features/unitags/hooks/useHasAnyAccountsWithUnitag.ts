import { useUnitagsAddressesQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

export function useHasAnyAccountsWithUnitag(): boolean {
  const accounts = useSignerAccounts()
  const addresses = accounts.map((account) => account.address)

  const response = useUnitagsAddressesQuery({ params: { addresses } })

  return !!response.data?.usernames.length
}
