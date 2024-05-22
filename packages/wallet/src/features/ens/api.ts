/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { providers } from 'ethers'
import { useMemo } from 'react'
import { useRestQuery } from 'uniswap/src/data/rest'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { ChainId } from 'wallet/src/constants/chains'
import { createEthersProvider } from 'wallet/src/features/providers/createEthersProvider'
import { areAddressesEqual } from 'wallet/src/utils/addresses'

// stub endpoint to conform to REST endpoint styles
// Rest link should intercept and use custom fetcher instead
export const STUB_ONCHAIN_ENS_ENDPOINT = '/onchain-ens'

export enum EnsLookupType {
  Name = 'name',
  Address = 'address',
  Avatar = 'avatar',
  Description = 'description',
  TwitterUsername = 'com.twitter',
}

export type EnsLookupParams = {
  type: EnsLookupType
  nameOrAddress: string
  chainId: ChainId
}

async function getNameFetch(address: string, provider: providers.JsonRpcProvider) {
  const name = await provider.lookupAddress(address)

  // ENS does not enforce that an address owns a .eth domain before setting it as a reverse proxy
  // and recommends that you perform a match on the forward resolution
  // see: https://docs.ens.domains/dapp-developer-guide/resolving-names#reverse-resolution
  const fwdAddr = name ? await provider.resolveName(name) : null

  // Normalize data as provider response is checksummed
  return areAddressesEqual(fwdAddr, address) ? name : null
}

async function getAddressFetch(name: string, provider: providers.JsonRpcProvider) {
  return await provider.resolveName(name)
}

async function getAvatarFetch(address: string, provider: providers.JsonRpcProvider) {
  const name = await provider.lookupAddress(address)
  const fwdAddr = name ? await provider.resolveName(name) : null
  const checkedName = areAddressesEqual(address, fwdAddr) ? name : null
  return checkedName ? await provider.getAvatar(checkedName) : null
}

async function getTextFetch(key: string, name: string, provider: providers.JsonRpcProvider) {
  const resolver = await provider.getResolver(name)
  const text = resolver?.getText(key)
  return text ?? null
}

export const getOnChainEnsFetch = async (params: EnsLookupParams): Promise<Response> => {
  const { type, nameOrAddress } = params
  const provider = createEthersProvider(ChainId.Mainnet)
  if (!provider) {
    return new Response(JSON.stringify({ data: undefined }))
  }

  let response: string | null

  switch (type) {
    case EnsLookupType.Name:
      response = await getNameFetch(nameOrAddress, provider)
      break
    case EnsLookupType.Address:
      response = await getAddressFetch(nameOrAddress, provider)
      break
    case EnsLookupType.Avatar:
      response = await getAvatarFetch(nameOrAddress, provider)
      break
    case EnsLookupType.Description:
      response = await getTextFetch('description', nameOrAddress, provider)
      break
    case EnsLookupType.TwitterUsername:
      response = await getTextFetch('com.twitter', nameOrAddress, provider)
      break
    default:
      throw new Error(`Invalid ENS lookup type: ${type}`)
  }

  return new Response(JSON.stringify({ data: response }))
}

function useEnsQuery(
  type: EnsLookupType,
  nameOrAddress?: string | null,
  chainId: ChainId = ChainId.Mainnet
) {
  const result = useRestQuery<{ data: Maybe<string>; timestamp: number }, EnsLookupParams>(
    STUB_ONCHAIN_ENS_ENDPOINT, // will invoke `getOnChainEnsFetch`
    // the query is skipped if this is not defined so the assertion is okay
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    { type, nameOrAddress: nameOrAddress!, chainId },
    ['data'],
    { ttlMs: 5 * ONE_MINUTE_MS, skip: !nameOrAddress }
  )

  const { data, error } = result

  return useMemo(
    () => ({
      ...result,
      data: data?.data,
      error,
    }),
    [data, error, result]
  )
}

export function useENSName(address?: Address, chainId: ChainId = ChainId.Mainnet) {
  return useEnsQuery(EnsLookupType.Name, address, chainId)
}
export function useAddressFromEns(maybeName: string | null, chainId: ChainId = ChainId.Mainnet) {
  return useEnsQuery(EnsLookupType.Address, maybeName, chainId)
}
export function useENSAvatar(address?: string | null, chainId: ChainId = ChainId.Mainnet) {
  return useEnsQuery(EnsLookupType.Avatar, address, chainId)
}
export function useENSDescription(name?: string | null, chainId: ChainId = ChainId.Mainnet) {
  return useEnsQuery(EnsLookupType.Description, name, chainId)
}
export function useENSTwitterUsername(name?: string | null, chainId: ChainId = ChainId.Mainnet) {
  return useEnsQuery(EnsLookupType.TwitterUsername, name, chainId)
}
