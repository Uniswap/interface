import { useEffect, useState } from 'react'
import { useActiveWeb3React } from '../../hooks'
import { Fetcher } from 'dxswap-sdk'

// this updater makes sure the token icons cache is populated before accessing it
export default function Updater() {
  const { chainId } = useActiveWeb3React()
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (chainId && !fetched) {
      Fetcher.populateTokenLogoCache(chainId)
        .then(() => {
          setFetched(true)
        })
        .catch((error: Error) => {
          console.error('Could not populate token icons cache', error)
        })
    }
  }, [chainId, fetched])

  return null
}
