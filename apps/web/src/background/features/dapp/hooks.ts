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
}

export function useDappContext(updateTrigger?: boolean): DappContext {
  const [dappUrl, setDappUrl] = useState('')
  const [dappName, setDappName] = useState('')
  const [dappConnected, setDappConnected] = useState(false)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (tab) {
        setDappUrl(extractBaseUrl(tab?.url) || '')
        setDappName(tab?.title || '')
      }
    })

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
  }, [updateTrigger])

  return { dappUrl, dappName, dappConnected }
}
