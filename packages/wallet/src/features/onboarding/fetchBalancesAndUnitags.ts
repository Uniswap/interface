import { getWalletBalancesIncludeCategories } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import {
  fetchWalletsBalances,
  selectTotalsByRequestedAddress,
  toEvmWallets,
} from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletsBalances/getWalletsBalances'
import { unitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

type UnitagByAddress = Awaited<ReturnType<typeof unitagsApiClient.fetchUnitagsByAddresses>>['usernames']

export async function fetchBalancesAndUnitags({
  addresses,
  chainIds,
}: {
  addresses: Address[]
  chainIds: UniverseChainId[]
}): Promise<{
  balanceByAddress: AddressTo<number | undefined>
  unitagByAddress: UnitagByAddress
}> {
  if (addresses.length === 0) {
    return { balanceByAddress: {}, unitagByAddress: {} }
  }

  const modifiers = addresses.map((address) => ({
    address,
    includeSmallBalances: true,
    includeSpamTokens: false,
  }))

  const [balancesResponse, unitagsResponse] = await Promise.all([
    fetchWalletsBalances({
      wallets: toEvmWallets(addresses),
      chainIds,
      modifiers,
      includeCategories: getWalletBalancesIncludeCategories(),
    }),
    unitagsApiClient.fetchUnitagsByAddresses({ addresses }),
  ])

  return {
    balanceByAddress: selectTotalsByRequestedAddress(addresses)(balancesResponse) ?? {},
    unitagByAddress: unitagsResponse.usernames,
  }
}
