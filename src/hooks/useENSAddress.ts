import { useEffect, useState } from 'react'
import { useActiveWeb3React } from './index'

/**
 * Does a lookup for an ENS name to find its address.
 */
export default function useENSAddress(ensName?: string | null): { loading: boolean; address: string | null } {
  const { library } = useActiveWeb3React()

  const [address, setAddress] = useState<{ loading: boolean; address: string | null }>({
    loading: false,
    address: null
  })

  useEffect(() => {
    if (!library || typeof ensName !== 'string') {
      setAddress({ loading: false, address: null })
      return
    } else {
      let stale = false
      setAddress({ loading: true, address: null })
      library
        .resolveName(ensName)
        .then(address => {
          if (!stale) {
            if (address) {
              setAddress({ loading: false, address })
            } else {
              setAddress({ loading: false, address: null })
            }
          }
        })
        .catch(() => {
          if (!stale) {
            setAddress({ loading: false, address: null })
          }
        })

      return () => {
        stale = true
      }
    }
  }, [library, ensName])

  return address
}
