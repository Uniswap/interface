import { namehash } from '@ethersproject/hash'
import { NEVER_RELOAD } from '@uniswap/redux-multicall'
import { BigNumber } from 'ethers'
import { hexZeroPad, isAddress } from 'ethers/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import {
  useENSRegistrarContract,
  useENSResolverContract,
  useERC1155Contract,
  useERC721Contract,
} from 'src/features/contracts/useContract'
import { updateAvatarUri, useCachedEns } from 'src/features/ens/ensSlice'
import { useENS } from 'src/features/ens/useENS'
import { useSingleCallResult } from 'src/features/multicall'
import { isZero } from 'src/utils/number'
import { uriToHttp } from 'src/utils/uriToHttp'

/**
 * Returns the ENS avatar URI, if available.
 * Spec: https://gist.github.com/Arachnid/9db60bd75277969ee1689c8742b75182.
 */
export default function useENSAvatar(address?: string): {
  avatar: string | null
  loading: boolean
} {
  // fetch saved uri from cache
  const { avatarUri: cachedUri } = useCachedEns(address)

  const node = useMemo(() => {
    if (!address || !isAddress(address)) return undefined
    return namehash(`${address.toLowerCase().substr(2)}.addr.reverse`)
  }, [address])

  const addressAvatar = useAvatarFromNode(node)
  const { name: ENSName } = useENS(ChainId.Mainnet, address)
  const nameAvatar = useAvatarFromNode(ENSName === null ? undefined : safeNamehash(ENSName))
  let avatarUri = addressAvatar.avatar || nameAvatar.avatar

  const nftAvatar = useAvatarFromNFT(address, avatarUri)
  avatarUri = nftAvatar.avatar || avatarUri

  const http = avatarUri && uriToHttp(avatarUri)[0]

  // Update cache if valid avatar URI found
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (address && http) {
      dispatch(updateAvatarUri({ address, avatarUri: http }))
    }
  }, [address, dispatch, http])

  return useMemo(
    () => ({
      avatar: http ?? cachedUri ?? null,
      loading: addressAvatar.loading || nameAvatar.loading || nftAvatar.loading,
    }),
    [addressAvatar.loading, cachedUri, http, nameAvatar.loading, nftAvatar.loading]
  )
}

function useAvatarFromNode(node?: string): { avatar?: string; loading: boolean } {
  const nodeArgument = useMemo(() => [node], [node])
  const textArgument = useMemo(() => [node, 'avatar'], [node])
  const registrarContract = useENSRegistrarContract(ChainId.Mainnet)
  const resolverAddress = useSingleCallResult(
    ChainId.Mainnet,
    registrarContract,
    'resolver',
    nodeArgument,
    NEVER_RELOAD
  )
  const resolverAddressResult = resolverAddress.result?.[0]
  const resolverContract = useENSResolverContract(
    ChainId.Mainnet,
    resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined
  )
  const avatar = useSingleCallResult(
    ChainId.Mainnet,
    resolverContract,
    'text',
    textArgument,
    NEVER_RELOAD
  )

  return useMemo(
    () => ({
      avatar: avatar.result?.[0],
      loading: resolverAddress.loading || avatar.loading,
    }),
    [avatar.loading, avatar.result, resolverAddress.loading]
  )
}

function useAvatarFromNFT(
  address: string | undefined,
  nftUri = ''
): { avatar?: string; loading: boolean } {
  // Extract meta data based on ENS avatar standard.
  const parts = nftUri.toLowerCase().split(':')
  const protocol = parts[0]
  const standard = parts[1]
  const tokenIdentifier = parts[2]
  // ignore the chain from eip155
  // TODO: when we are able, pull only from the specified chain
  const [, erc] = standard?.split('/') ?? []
  const [contractAddress, id] = tokenIdentifier?.split('/').map((a) => a?.trim()) ?? []
  const isERC721 = protocol === 'eip155' && erc === 'erc721'
  const isERC1155 = protocol === 'eip155' && erc === 'erc1155'
  const erc721 = useERC721Uri(isERC721 ? contractAddress : undefined, id)
  const erc1155 = useERC1155Uri(isERC1155 ? contractAddress : undefined, id)
  const uri = erc721.uri || erc1155.uri
  const http = uri && uriToHttp(uri)[0]

  const [loading, setLoading] = useState(false)
  const [avatar, setAvatar] = useState(undefined)
  useEffect(() => {
    setAvatar(undefined)
    if (http) {
      setLoading(true)
      fetch(http)
        .then((res) => res.json())
        .then(({ image }) => {
          setAvatar(image)
        })
        .catch()
        .finally(() => {
          setLoading(false)
        })
    }
  }, [http])

  return useMemo(
    () => ({ avatar, loading: erc721.loading || erc1155.loading || loading }),
    [avatar, erc1155.loading, erc721.loading, loading]
  )
}

function useERC721Uri(
  contractAddress: string | undefined,
  id: string | undefined
): { uri?: string; loading: boolean } {
  const idArgument = useMemo(() => [id], [id])
  const contract = useERC721Contract(ChainId.Mainnet, contractAddress)
  const uri = useSingleCallResult(ChainId.Mainnet, contract, 'tokenURI', idArgument, NEVER_RELOAD)
  return useMemo(
    () => ({
      uri: uri.result?.[0],
      loading: uri.loading,
    }),
    [uri.loading, uri.result]
  )
}

function useERC1155Uri(
  contractAddress: string | undefined,
  id: string | undefined
): { uri?: string; loading: boolean } {
  const idArgument = useMemo(() => [id], [id])
  const contract = useERC1155Contract(ChainId.Mainnet, contractAddress)
  const uri = useSingleCallResult(ChainId.Mainnet, contract, 'uri', idArgument, NEVER_RELOAD)
  // ERC-1155 allows a generic {id} in the URL, so prepare to replace if relevant,
  //   in lowercase hexadecimal (with no 0x prefix) and leading zero padded to 64 hex characters.
  const idHex = id ? hexZeroPad(BigNumber.from(id).toHexString(), 32).substring(2) : id
  return useMemo(
    () => ({
      uri: uri.result?.[0]?.replaceAll('{id}', idHex),
      loading: uri.loading,
    }),
    [uri.loading, uri.result, idHex]
  )
}

export function safeNamehash(name?: string): string | undefined {
  if (name === undefined) return undefined
  try {
    return namehash(name)
  } catch (error) {
    return undefined
  }
}
