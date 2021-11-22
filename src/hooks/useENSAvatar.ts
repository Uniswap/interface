import { useWeb3React } from '@web3-react/core'
import { useEffect, useState } from 'react'

// @ts-nocheck
const { CID } = require('multiformats/esm/src/cid')

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/'

export interface ENSAvatarData {
  uri: string
  host_meta: {
    chain_id: number
    namespace: string
    contract_address: string
    token_id: string
    reference_url: string
  }
  is_owner: boolean
  description: string
  image: string
  name: string
}

export interface UseENSAvatarReturn {
  loading: boolean
  data?: ENSAvatarData
}

export function isCID(hash: string) {
  try {
    if (typeof hash === 'string') {
      return Boolean(CID.parse(hash))
    }
    return Boolean(CID.asCID(hash))
  } catch (e) {
    return false
  }
}

// Map chainId to network name for fetch request
const supportedENSNetworks: { [chainId: number]: string } = {
  1: 'mainnet',
  4: 'rinkeby'
}
// List of chains where ENS is deployed
const supportedENSChainIds = [1, 4]
// List of supported procotols that can be resovled to a URI

/**
 * Does a lookup for an ENS name to find its avatar details, uses ENS Domains metadata API
 */
export function useENSAvatar(ensName?: string | null) {
  const [avatar, setAvatar] = useState<ENSAvatarData>()
  const [loading, setLoading] = useState<boolean>(true)
  const { chainId } = useWeb3React()

  useEffect(() => {
    // ENS supports Mainnet and Rinkeby
    if (!supportedENSChainIds.includes(chainId as number) || !ensName) {
      setLoading(false)
      return
    }

    const networkName = supportedENSNetworks[chainId as number]

    fetch(`https://metadata.ens.domains/${networkName}/avatar/${ensName}/meta`)
      .then(res => res.json())
      .then(data => {
        if ('image' in data && data.image) {
          if (data.image.startsWith('ipfs://ipfs/')) {
            data.image = data.image.replace('ipfs://ipfs/', IPFS_GATEWAY)
          } else if (data.image.startsWith('ipfs://')) {
            data.image = data.image.replace('ipfs://', IPFS_GATEWAY)
          } else if (data.image.startsWith('ipfs/')) {
            data.image = data.image.replace('ipfs/', IPFS_GATEWAY)
          } else if (isCID(data.image)) {
            data.image = `${IPFS_GATEWAY}${data.image}`
          }
        }
        setAvatar(data)
        setLoading(false)
      })
      .catch(e => {
        console.error('useAvatar error: ', e)
      })
  }, [chainId, ensName])

  return {
    loading,
    avatar
  }
}
