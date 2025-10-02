/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { skipToken, useQuery } from '@tanstack/react-query'
import { providers } from 'ethers/lib/ethers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { createEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

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
  chainId: UniverseChainId
}

async function getNameFetch(address: string, provider: providers.JsonRpcProvider) {
  const name = await provider.lookupAddress(address)

  // ENS does not enforce that an address owns a .eth domain before setting it as a reverse proxy
  // and recommends that you perform a match on the forward resolution
  // see: https://docs.ens.domains/dapp-developer-guide/resolving-names#reverse-resolution
  const fwdAddr = name ? await provider.resolveName(name) : null

  // Normalize data as provider response is checksummed
  return areAddressesEqual({
    addressInput1: { address: fwdAddr, platform: Platform.EVM },
    addressInput2: { address, platform: Platform.EVM },
  })
    ? name
    : null
}

async function getAddressFetch(name: string, provider: providers.JsonRpcProvider) {
  return await provider.resolveName(name)
}

async function getAvatarFetch(address: string, provider: providers.JsonRpcProvider) {
  const name = await provider.lookupAddress(address)
  const fwdAddr = name ? await provider.resolveName(name) : null
  const checkedName = areAddressesEqual({
    addressInput1: { address, platform: Platform.EVM },
    addressInput2: { address: fwdAddr, platform: Platform.EVM },
  })
    ? name
    : null
  return checkedName ? await provider.getAvatar(checkedName) : null
}

async function getTextFetch({
  key,
  name,
  provider,
}: {
  key: string
  name: string
  provider: providers.JsonRpcProvider
}) {
  const resolver = await provider.getResolver(name)
  const text = resolver?.getText(key)
  return text ?? null
}

async function getOnChainEnsFetch(params: EnsLookupParams): Promise<string | null> {
  const { type, nameOrAddress } = params

  const provider = createEthersProvider({ chainId: UniverseChainId.Mainnet })

  if (!provider) {
    return null
  }

  switch (type) {
    case EnsLookupType.Name:
      return await getNameFetch(nameOrAddress, provider)
    case EnsLookupType.Address:
      return await getAddressFetch(nameOrAddress, provider)
    case EnsLookupType.Avatar:
      return await getAvatarFetch(nameOrAddress, provider)
    case EnsLookupType.Description:
      return await getTextFetch({ key: 'description', name: nameOrAddress, provider })
    case EnsLookupType.TwitterUsername:
      return await getTextFetch({ key: 'com.twitter', name: nameOrAddress, provider })
    default:
      throw new Error(`Invalid ENS lookup type: ${type}`)
  }
}

function useEnsQuery(type: EnsLookupType, nameOrAddress?: string | null) {
  return useQuery<string | null>({
    queryKey: [ReactQueryCacheKey.OnchainENS, type, nameOrAddress],
    queryFn: nameOrAddress
      ? async (): ReturnType<typeof getOnChainEnsFetch> =>
          await getOnChainEnsFetch({ type, nameOrAddress, chainId: UniverseChainId.Mainnet })
      : skipToken,
    staleTime: 5 * ONE_MINUTE_MS,
  })
}

export function useENSName(address?: Address) {
  const isValidEVMAddress = isEVMAddress(address)
  return useEnsQuery(EnsLookupType.Name, isValidEVMAddress ? address : undefined)
}
export function useAddressFromEns(maybeName: string | null) {
  return useEnsQuery(EnsLookupType.Address, maybeName)
}
export function useENSAvatar(address?: string | null) {
  const isValidEVMAddress = isEVMAddress(address)
  return useEnsQuery(EnsLookupType.Avatar, isValidEVMAddress ? address : undefined)
}
export function useENSDescription(name?: string | null) {
  return useEnsQuery(EnsLookupType.Description, name)
}
export function useENSTwitterUsername(name?: string | null) {
  return useEnsQuery(EnsLookupType.TwitterUsername, name)
}
