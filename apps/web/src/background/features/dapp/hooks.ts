import { useEffect, useState } from 'react'
import { extractBaseUrl } from 'src/background/features/dappRequests/utils'
import { sendMessageToActiveTab } from 'src/background/utils/messageUtils'
import {
  DappToExtensionRequestType,
  ExtensionRequestType,
  GetConnectionStatusRequest,
} from 'src/types/requests'
import { v4 as uuidv4 } from 'uuid'

type DappContext = {
  dappUrl: string
  dappName: string
  dappConnected: boolean
  dappIconUrl?: string
}

/**
 * Hook used to get the dApp context
 * @param tabId - the id of the tab to get the dapp context from (undefined defaults to the active tab).
 * We should typically use a specific tabId, and use active tab only when dapp details do not matter (e.g. popup edge cases)
 * @param updateTrigger - a boolean that can be used to trigger an update of the dapp context
 **/
export function useDappContext(tabId?: number, updateTrigger?: boolean): DappContext {
  const [dappUrl, setDappUrl] = useState('')
  const [dappName, setDappName] = useState('')
  const [dappConnected, setDappConnected] = useState(false)
  const [dappIconUrl, setDappIconUrl] = useState<string | undefined>(undefined)

  // TODO (EXT-188): add a way to update this dapp context whenver the active tab changes
  useEffect(() => {
    if (tabId) {
      chrome.tabs.get(tabId, (tab) => {
        setDappUrl(extractBaseUrl(tab?.url) || '')
        setDappName(tab?.title || '')
        setDappIconUrl(tab.favIconUrl)
      })
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0]
        if (tab) {
          setDappUrl(extractBaseUrl(tab?.url) || '')
          setDappName(tab?.title || '')
          setDappIconUrl(tab.favIconUrl)
        }
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connectionStatusListener = (request: any): void => {
      if (request?.type === DappToExtensionRequestType.ConnectionStatus) {
        setDappConnected(request.connected || false)
        chrome.runtime.onMessage.removeListener(connectionStatusListener)
      }
    }

    chrome.runtime.onMessage.addListener(connectionStatusListener)
    const request: GetConnectionStatusRequest = {
      type: ExtensionRequestType.GetConnectionStatus,
      requestId: uuidv4(),
    }
    sendMessageToActiveTab(request)
  }, [updateTrigger, tabId])

  return { dappUrl, dappName, dappConnected, dappIconUrl }
}
