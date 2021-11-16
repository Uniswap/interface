import { namehash } from '@ethersproject/hash'
import { useEffect, useMemo, useState } from 'react'
import uriToHttp from 'utils/uriToHttp'

import { useSingleCallResult } from '../state/multicall/hooks'
import { isAddress } from '../utils'
import isZero from '../utils/isZero'
import { useENSRegistrarContract, useENSResolverContract, useERC721Contract } from './useContract'
import useDebounce from './useDebounce'
import useENSName from './useENSName'
import { useActiveWeb3React } from './web3'

/**
 * Returns the ENS avatar URI, if available.
 * Spec: https://gist.github.com/Arachnid/9db60bd75277969ee1689c8742b75182.
 */
export default function useENSAvatar(
  address?: string,
  enforceOwnership = true
): { avatar: string | null; loading: boolean } {
  const debouncedAddress = useDebounce(address, 200)
  const ensNode = useMemo(() => {
    if (!debouncedAddress || !isAddress(debouncedAddress)) return undefined
    try {
      return debouncedAddress ? namehash(`${debouncedAddress.toLowerCase().substr(2)}.addr.reverse`) : undefined
    } catch (error) {
      return undefined
    }
  }, [debouncedAddress])

  const addressAvatar = useAvatarFromNode(ensNode)
  const nameAvatar = useAvatarFromNode(namehash(useENSName(address).ENSName ?? ''))
  let avatar = addressAvatar.avatar || nameAvatar.avatar

  const nftAvatar = useAvatarFromNFT(avatar, enforceOwnership)
  avatar = nftAvatar.avatar || avatar

  const http = avatar && uriToHttp(avatar)[0]

  const changed = debouncedAddress !== address
  return {
    avatar: changed ? null : http ?? null,
    loading: changed || addressAvatar.loading || nameAvatar.loading || nftAvatar.loading,
  }
}

function useAvatarFromNode(node = ''): { avatar?: string; loading: boolean } {
  const registrarContract = useENSRegistrarContract(false)
  const resolverAddress = useSingleCallResult(registrarContract, 'resolver', [node])
  const resolverAddressResult = resolverAddress.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined,
    false
  )
  const avatar = useSingleCallResult(resolverContract, 'text', [node, 'avatar'])

  return {
    avatar: avatar.result?.[0],
    loading: resolverAddress.loading || avatar.loading,
  }
}

function useAvatarFromNFT(avatar = '', enforceOwnership: boolean): { avatar?: string; loading: boolean } {
  const parts = avatar.toLowerCase().split(':')
  const protocol = parts[0]
  // ignore the chain from eip155
  // TODO: when we are able, pull only from the specified chain
  const [, erc] = parts[1]?.split('/') ?? []
  const [contractAddress, id] = parts[2]?.split('/') ?? []
  const erc721 = useAvatarFromERC721((protocol === 'eip155' && erc === 'erc721' && contractAddress) || undefined, id)
  if (erc721.avatar && (!enforceOwnership || erc721.owned)) {
    return erc721
  }
  return { loading: erc721.loading }
}

function useAvatarFromERC721(address?: string, id?: string): { avatar?: string; owned: boolean; loading: boolean } {
  const { account } = useActiveWeb3React()
  const contract = useERC721Contract(address)
  const owner = useSingleCallResult(contract, 'ownerOf', [id])
  const metadata = useSingleCallResult(contract, 'tokenURI', [id])
  const http = metadata.result && uriToHttp(metadata.result?.[0])[0]

  const [loading, setLoading] = useState(false)
  const [avatar, setAvatar] = useState(undefined)
  useEffect(() => {
    if (http) {
      setLoading(true)
      fetch(http)
        .then((res) => res.json())
        .then(({ image }) => {
          setAvatar(image)
        })
        .catch((e) => console.warn(e))
        .finally(() => {
          setLoading(false)
        })
    }
  }, [http])
  return { avatar, owned: account === owner.result?.[0], loading: owner.loading || metadata.loading || loading }
}
