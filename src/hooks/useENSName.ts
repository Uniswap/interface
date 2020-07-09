import { useEffect, useState } from 'react'
import { isAddress } from '../utils'
import { useActiveWeb3React } from './index'

/**
 * Does a reverse lookup for an address to find its ENS name.
 * Note this is not the same as looking up an ENS name to find an address.
 */
export default function useENSName(address?: string): { ENSName: string | null; loading: boolean } {
  const { library } = useActiveWeb3React()

  const [ENSName, setENSName] = useState<{ ENSName: string | null; loading: boolean }>({
    loading: false,
    ENSName: null
  })

  useEffect(() => {
    const validated = isAddress(address)
    if (!library || !validated) {
      setENSName({ loading: false, ENSName: null })
      return
    } else {
      let stale = false
      setENSName({ loading: true, ENSName: null })
      library
        .lookupAddress(validated)
        .then(name => {
          if (!stale) {
            if (name) {
              setENSName({ loading: false, ENSName: name })
            } else {
              setENSName({ loading: false, ENSName: null })
            }
          }
        })
        .catch(() => {
          if (!stale) {
            setENSName({ loading: false, ENSName: null })
          }
        })

      return () => {
        stale = true
      }
    }
  }, [library, address])

  return ENSName
}
