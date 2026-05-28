import { useUnitagsAddressesQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

export function useHasAnyAccountsWithUnitag(): boolean {
  const accounts = useSignerAccounts()
  const addresses = accounts.map((account) => account.address)
  const shouldQuery = addresses.length > 0

  const { data } = useUnitagsAddressesQuery({
    params: shouldQuery ? { addresses } : undefined,
  })

  if (!shouldQuery) {
    return false
  }

  const usernamesByAddress = data?.usernames
  if (!usernamesByAddress) {
    return false
  }

  return Object.values(usernamesByAddress).some((response) => Boolean(response.username))
}
