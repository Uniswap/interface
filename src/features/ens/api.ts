import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react'
import { walletContextValue } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { areAddressesEqual } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'
import { ONE_MINUTE_MS } from 'src/utils/time'

export type EnslookupParams = {
  nameOrAddress: NullUndefined<string>
  chainId: ChainId
}

const ENS_REDUCER_NAME = 'ENS'

const staggeredBaseQuery = retry(fetchBaseQuery({ baseUrl: '/' }), {
  maxRetries: 5,
})

export const ensApi = createApi({
  reducerPath: ENS_REDUCER_NAME,
  baseQuery: staggeredBaseQuery,
  keepUnusedDataFor: 5 * ONE_MINUTE_MS,
  endpoints: (builder) => ({
    // takes an address "0xasdf..." and converts it to the ENS "x.eth"
    name: builder.query<string | null, EnslookupParams>({
      queryFn: async (params: EnslookupParams) => {
        const { nameOrAddress: address } = params
        try {
          if (!address) return { data: null }

          const provider = walletContextValue.providers.getProvider(ChainId.Mainnet)
          const name = await provider.lookupAddress(address)

          /* ENS does not enforce that an address owns a .eth domain before setting it as a reverse proxy
            and recommends that you perform a match on the forward resolution
            see: https://docs.ens.domains/dapp-developer-guide/resolving-names#reverse-resolution
          */
          const fwdAddr = name ? await provider.resolveName(name) : null
          // Normalize data as provider response is checksummed
          const checkedName = areAddressesEqual(fwdAddr, address) ? name : null
          return { data: checkedName }
        } catch (e: unknown) {
          logger.error('ens/api', 'name', 'Error getting ens name', e)
          return { error: { status: 500, data: e } }
        }
      },
    }),

    // takes a name e.g. "payian.eth" and returns the address (or null if no record exists)
    address: builder.query<string | null, EnslookupParams>({
      queryFn: async (params: EnslookupParams) => {
        const { nameOrAddress: name } = params
        try {
          if (!name) return { data: null }
          const provider = walletContextValue.providers.getProvider(ChainId.Mainnet)
          const address = await provider.resolveName(name)

          return { data: address }
        } catch (e: unknown) {
          logger.error('ens/api', 'address', 'Error getting ens address', e)
          return { error: { status: 500, data: e } }
        }
      },
    }),

    // Takes an address, does ens name lookup, and returns the URL for ENS Avatar, if set.
    // We duplicate logic from "name" query to benefit from caching on address only
    avatar: builder.query<string | null, EnslookupParams>({
      queryFn: async (params: EnslookupParams) => {
        const { nameOrAddress: address } = params
        try {
          if (!address) return { data: null }

          const provider = walletContextValue.providers.getProvider(ChainId.Mainnet)
          const name = await provider.lookupAddress(address)
          const fwdAddr = name ? await provider.resolveName(name) : null
          const checkedName = areAddressesEqual(address, fwdAddr) ? name : null
          const avatarURL = checkedName ? await provider.getAvatar(checkedName) : null
          return { data: avatarURL }
        } catch (e: unknown) {
          logger.error('ens/api', 'avatar', 'Error getting ens avatar', e)
          return { error: { status: 500, data: e } }
        }
      },
    }),
  }),
})

const { useNameQuery, useAddressQuery, useAvatarQuery } = ensApi

export function useENSName(address?: Address, chainId: ChainId = ChainId.Mainnet) {
  return useNameQuery({ nameOrAddress: address, chainId })
}

export function useAddressFromEns(maybeName: string | null, chainId: ChainId = ChainId.Mainnet) {
  return useAddressQuery({ nameOrAddress: maybeName, chainId })
}

export function useENSAvatar(address?: string | null, chainId: ChainId = ChainId.Mainnet) {
  return useAvatarQuery({ nameOrAddress: address, chainId })
}
