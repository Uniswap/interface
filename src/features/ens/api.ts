import { SerializeQueryArgs } from '@reduxjs/toolkit/dist/query/defaultSerializeQueryArgs'
import { createApi, FetchArgs, fetchBaseQuery, skipToken } from '@reduxjs/toolkit/query/react'
import { providers } from 'ethers'
import { useProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { areAddressesEqual } from 'src/utils/addresses'

export type EnslookupParams = {
  nameOrAddress: string
  provider: providers.Provider
  chainId: ChainId
}

const ENS_REDUCER_NAME = 'ENS'

// manually serialize query args for cache indexing because
// provider is not serializable
const serializeQueryArgs: SerializeQueryArgs<string | FetchArgs> = (args) => {
  const { queryArgs, endpointName } = args
  const ensArgs = queryArgs as unknown as EnslookupParams // cast as correct query types here
  return `${ENS_REDUCER_NAME}-${endpointName}-${ensArgs.chainId}-${ensArgs.nameOrAddress}`
}

export const ens = createApi({
  reducerPath: ENS_REDUCER_NAME,
  serializeQueryArgs,
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: (builder) => ({
    // takes an address "0xasdf..." and converts it to the ENS "x.eth"
    name: builder.query<string | null, EnslookupParams>({
      queryFn: async (params: EnslookupParams) => {
        const { nameOrAddress: address, provider } = params
        try {
          const name = await provider.lookupAddress(address)

          /* ENS does not enforce that an address owns a .eth domain before setting it as a reverse proxy
            and recommends that you perform a match on the forward resolution
            see: https://docs.ens.domains/dapp-developer-guide/resolving-names#reverse-resolution
          */
          const fwdAddr = name ? await provider.resolveName(name) : null
          // Normalize data as provider response is checksummed
          const checkedName = areAddressesEqual(fwdAddr, address) ? name : null
          return { data: checkedName }
        } catch (_) {
          // ENS lookup may throw an error if the chain (e.g. Optimism) does not support ENS
          return { data: null }
        }
      },
    }),

    // takes a name e.g. "payian.eth" and returns the address (or null if no record exists)
    address: builder.query<string | null, EnslookupParams>({
      queryFn: async (params: EnslookupParams) => {
        const { nameOrAddress: name, provider } = params
        try {
          const address = await provider.resolveName(name)
          return { data: address }
        } catch (_) {
          // ENS lookup may throw an error if the chain (e.g. Optimism) does not support ENS
          return { data: null }
        }
      },
    }),
  }),
})

const { useNameQuery, useAddressQuery } = ens

export function useENSName(address?: Address, chainId: ChainId = ChainId.Mainnet) {
  const provider = useProvider(chainId)
  return useNameQuery(
    provider && address ? { provider, nameOrAddress: address, chainId } : skipToken
  )
}

export function useAddressFromEns(ensName?: string | null, chainId: ChainId = ChainId.Mainnet) {
  const provider = useProvider(chainId)
  return useAddressQuery(
    provider && ensName ? { provider, nameOrAddress: ensName, chainId } : skipToken
  )
}
