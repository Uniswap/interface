import { namehash } from '@ethersproject/hash'
import { useMemo } from 'react'
import uriToHttp from 'utils/uriToHttp'

import { useSingleCallResult } from '../state/multicall/hooks'
import { isAddress } from '../utils'
import isZero from '../utils/isZero'
import { useENSRegistrarContract, useENSResolverContract } from './useContract'
import useDebounce from './useDebounce'
import useENSName from './useENSName'

/**
 * Does an ENS avatar lookup.
 * Spec: https://gist.github.com/Arachnid/9db60bd75277969ee1689c8742b75182.
 */
export default function useENSAvatarUri(address?: string): { avatar: string | null; loading: boolean } {
  const debouncedAddress = useDebounce(address, 200)
  const ensNodeArgument = useMemo(() => {
    if (!debouncedAddress || !isAddress(debouncedAddress)) return [undefined]
    try {
      return debouncedAddress ? [namehash(`${debouncedAddress.toLowerCase().substr(2)}.addr.reverse`)] : [undefined]
    } catch (error) {
      return [undefined]
    }
  }, [debouncedAddress])
  const addrAvatar = useENSNodeAvatar(ensNodeArgument[0])

  const name = useENSName(address)
  const nameAvatar = useENSNodeAvatar(namehash(name.ENSName ?? ''))

  const changed = debouncedAddress !== address
  const avatar = addrAvatar.avatar || nameAvatar.avatar

  const uri = avatar ? uriToHttp(avatar)[0] : null
  // TODO: Support ERC721/ERC1155.

  return {
    avatar: changed ? null : uri,
    loading: changed || addrAvatar.loading || nameAvatar.loading,
  }
}

function useENSNodeAvatar(node = ''): { avatar: string | null; loading: boolean } {
  const registrarContract = useENSRegistrarContract(false)
  const resolverAddress = useSingleCallResult(registrarContract, 'resolver', [node])
  const resolverAddressResult = resolverAddress.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined,
    false
  )
  const avatar = useSingleCallResult(resolverContract, 'text', [node, 'avatar'])

  return {
    avatar: avatar.result?.[0] ?? null,
    loading: resolverAddress.loading || avatar.loading,
  }
}
