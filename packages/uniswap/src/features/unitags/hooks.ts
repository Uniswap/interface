import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useUnitagsUsernameQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery'
import { UnitagAddressResponse, UnitagUsernameResponse } from 'uniswap/src/features/unitags/types'

// TODO(WALL-4256): delete these helpers and just use `useUnitagsAddressQuery` and `useUnitagsUsernameQuery` where needed.

export const useUnitagByAddress = (
  address?: Address,
): { unitag?: UnitagAddressResponse; loading: boolean; pending: boolean; fetching: boolean } => {
  const { data, isLoading, isPending, isFetching } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })
  return { unitag: data, loading: isLoading, pending: isPending, fetching: isFetching }
}

export const useUnitagByName = (username?: string): { unitag?: UnitagUsernameResponse; loading: boolean } => {
  const { data, isLoading } = useUnitagsUsernameQuery({ params: username ? { username } : undefined })
  return { unitag: data, loading: isLoading }
}
