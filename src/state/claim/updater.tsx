import { useEffect } from 'react'
import { useClaimWhitelist, useClaimWhitelistUpdater } from './hooks'

export default function Updater(): null {
  const whitelist = useClaimWhitelist()
  const updateWhitelist = useClaimWhitelistUpdater()

  useEffect(() => {
    const fetchAndUpdateWhitelist = async () => {
      const response = await fetch(`https://dweb.link/ipfs/TODO`)
      if (!response.ok) {
        console.warn('could not load claim whitelist')
        return
      }
      const json = await response.json()
      updateWhitelist(json)
    }
    if (!whitelist || whitelist.length === 0) {
      // only fetch whitelist if previously not there
      fetchAndUpdateWhitelist()
    }
  }, [updateWhitelist, whitelist])

  return null
}
