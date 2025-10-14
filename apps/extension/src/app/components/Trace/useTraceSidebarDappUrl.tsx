import { datadogRum } from '@datadog/browser-rum'
import { useEffect } from 'react'
import { useDappContext } from 'src/app/features/dapp/DappContext'

/** Hook that tracks dapp URL for Datadog logs in the Sidebar */
export function useTraceSidebarDappUrl(): void {
  const dappContext = useDappContext()

  useEffect(() => {
    // Set dapp URL as global context property so it's included in all logs
    if (dappContext.dappUrl) {
      datadogRum.setGlobalContextProperty('dappUrl', dappContext.dappUrl)
    } else {
      // Remove the property when no dapp is active
      datadogRum.removeGlobalContextProperty('dappUrl')
    }
  }, [dappContext.dappUrl])
}
