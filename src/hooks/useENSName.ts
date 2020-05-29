import { useEffect, useState } from 'react'
import { isAddress } from '../utils'
import { useActiveWeb3React } from './index'

/**
 * Does a reverse lookup for an address to find its ENS name.
 * Note this is not the same as looking up an ENS name to find an address.
 */
export default function useENSName(address?: string): string | null {
  const { library } = useActiveWeb3React()

  const [ENSName, setENSName] = useState<string | null>(null)

  useEffect(() => {
    if (!library || !address) return
    const validated = isAddress(address)
    if (validated) {
      let stale = false
      library
        .lookupAddress(validated)
        .then(name => {
          if (!stale) {
            if (name) {
              setENSName(name)
            } else {
              setENSName(null)
            }
          }
        })
        .catch(() => {
          if (!stale) {
            setENSName(null)
          }
        })

      return () => {
        stale = true
        setENSName(null)
      }
    }
    return
  }, [library, address])

  return ENSName
}
