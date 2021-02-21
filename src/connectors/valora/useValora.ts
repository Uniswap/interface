import { DappKitRequestTypes, DappKitResponseStatus } from '@celo/utils'
import { useWeb3React } from '@web3-react/core'
import { valora } from 'connectors'
import { useCallback, useEffect } from 'react'
import { parseDappkitResponse, removeQueryParams } from './valoraUtils'

/**
 * useValora handles incoming valora requests
 */
export const useValora = () => {
  const { activate, account } = useWeb3React()

  const handleFocus = useCallback(() => {
    try {
      const data = parseDappkitResponse(window.location.href)
      if (!data) {
        return
      }
      if (
        data.type === DappKitRequestTypes.ACCOUNT_ADDRESS &&
        data.status === DappKitResponseStatus.SUCCESS &&
        account !== data.address
      ) {
        activate(valora, undefined, true).then(() => {
          // clear dappkit response from href
          window.location.href = removeQueryParams(window.location.href, [...Object.keys(data), 'account'])
        })
      }
    } catch (e) {
      if (!e.message.includes('Invalid Deeplink')) {
        alert('error: ' + e.message)
      }
    }
  }, [activate, account])

  useEffect(() => {
    window.addEventListener('focus', handleFocus, false)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [handleFocus])

  useEffect(() => {
    handleFocus()
  }, [handleFocus])
}
