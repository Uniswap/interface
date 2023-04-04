import { namehash } from '@ethersproject/hash'
import { useWeb3React } from '@web3-react/core'
import { useNftAssetDetails } from 'graphql/data/nft/Details'
import { useSingleCallResult } from 'lib/hooks/multicall'
import uriToHttp from 'lib/utils/uriToHttp'
import { useMemo } from 'react'

import { isAddress } from '../utils'
import isZero from '../utils/isZero'
import { useENSRegistrarContract, useENSResolverContract, useERC721Contract, useERC1155Contract } from './useContract'
import useDebounce from './useDebounce'
import useENSName from './useENSName'

/**
 * Returns the ENS avatar URI, if available.
 * Spec: https://gist.github.com/Arachnid/9db60bd75277969ee1689c8742b75182.
 */
export default function useENSAvatar(
  address?: string,
  enforceOwnership = true
): { avatar: string | null; loading: boolean } {
  const debouncedAddress = useDebounce(address, 200)
  const node = useMemo(() => {
    if (!debouncedAddress || !isAddress(debouncedAddress)) return undefined
    return namehash(`${debouncedAddress.toLowerCase().substr(2)}.addr.reverse`)
  }, [debouncedAddress])

  const addressAvatar = useAvatarFromNode(node)
  const ENSName = useENSName(address).ENSName
  const nameAvatar = useAvatarFromNode(ENSName === null ? undefined : namehash(ENSName))
  let avatar = addressAvatar.avatar || nameAvatar.avatar

  const nftAvatar = useAvatarFromNFT(avatar, enforceOwnership)
  avatar = nftAvatar.avatar || avatar

  const http = avatar && uriToHttp(avatar)[0]

  const changed = debouncedAddress !== address
  return useMemo(
    () => ({
      avatar: changed ? null : http ?? null,
      loading: changed || addressAvatar.loading || nameAvatar.loading || nftAvatar.loading,
    }),
    [addressAvatar.loading, changed, http, nameAvatar.loading, nftAvatar.loading]
  )
}

function useAvatarFromNode(node?: string): { avatar?: string; loading: boolean } {
  const nodeArgument = useMemo(() => [node], [node])
  const textArgument = useMemo(() => [node, 'avatar'], [node])
  const registrarContract = useENSRegistrarContract(false)
  const resolverAddress = useSingleCallResult(registrarContract, 'resolver', nodeArgument)
  const resolverAddressResult = resolverAddress.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined,
    false
  )
  const avatar = useSingleCallResult(resolverContract, 'text', textArgument)

  return useMemo(
    () => ({
      avatar: avatar.result?.[0],
      loading: resolverAddress.loading || avatar.loading,
    }),
    [avatar.loading, avatar.result, resolverAddress.loading]
  )
}

function useAvatarFromNFT(nftUri = '', enforceOwnership: boolean): { avatar?: string; loading: boolean } {
  const { account } = useWeb3React()
  const parts = nftUri.toLowerCase().split(':')
  const [contractAddress, id] = parts[2]?.split('/') ?? []
  const { data, loading } = useNftAssetDetails(contractAddress, id)
  const { owner } = useERC721Owner(contractAddress, id)
  const { balance: erc1155Balance } = useERC1155BalanceForOwner(contractAddress, id, account)
  const isOwner = owner?.toLowerCase() === account?.toLowerCase() || erc1155Balance > 0
  return useMemo(() => {
    return {
      avatar: isOwner || !enforceOwnership ? data?.[0]?.imageUrl : undefined,
      loading,
    }
  }, [data, enforceOwnership, isOwner, loading])
}

function useERC721Owner(
  contractAddress: string | undefined,
  id: string | undefined
): { owner?: string; loading: boolean } {
  const idArgument = useMemo(() => [id], [id])
  const contract = useERC721Contract(contractAddress)
  const owner = useSingleCallResult(contract, 'ownerOf', idArgument)
  return useMemo(
    () => ({
      owner: owner.result?.[0],
      loading: owner.loading,
    }),
    [owner.loading, owner.result]
  )
}

function useERC1155BalanceForOwner(
  contractAddress: string | undefined,
  id: string | undefined,
  ownerAddress: string | undefined
): { balance: number; loading: boolean } {
  const idArgument = useMemo(() => [id], [id])
  const accountArgument = useMemo(() => [ownerAddress || '', id], [ownerAddress, id])
  const contract = useERC1155Contract(contractAddress)
  const balance = useSingleCallResult(contract, 'balanceOf', accountArgument)
  const uri = useSingleCallResult(contract, 'uri', idArgument)
  return useMemo(() => {
    try {
      return {
        balance: balance.result?.[0] ?? 0,
        loading: balance.loading || uri.loading,
      }
    } catch (error) {
      console.error('Invalid token id', error)
      return { loading: false, balance: 0 }
    }
  }, [balance.loading, balance.result, uri.loading])
}
