import { useEffect } from 'react'
import { CLAIM_LEAVES_IPFS_HASH } from '../../constants'
import { useClaimTxConfirmedUpdater, useClaimWhitelist, useClaimWhitelistUpdater } from './hooks'

export default function Updater(): null {
  const whitelist = useClaimWhitelist()
  const updateWhitelist = useClaimWhitelistUpdater()
  const updateClaimTransactionConfirmed = useClaimTxConfirmedUpdater()

  useEffect(() => {
    const fetchAndUpdateWhitelist = async () => {
      const response = await fetch(`https://ipfs.io/ipfs/${CLAIM_LEAVES_IPFS_HASH}`)
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
    updateClaimTransactionConfirmed(false)
  }, [updateClaimTransactionConfirmed, updateWhitelist, whitelist])

  return null
}
