import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { selectDappConnectedAddresses } from 'src/background/features/dapp/selectors'
import { extractBaseUrl } from 'src/background/features/dappRequests/utils'
import { useAppSelector } from 'src/background/store'
import { isValidMessage } from 'src/background/utils/messageUtils'
import { BackgroundToExtensionRequestType } from 'src/types/requests'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

type DappContextState = {
  dappUrl: string
  dappName: string
  dappIconUrl?: string
  isConnected: boolean
}

const DappContext = createContext<DappContextState | undefined>(undefined)

export function DappContextProvider({ children }: { children: ReactNode }): JSX.Element {
  const [dappUrl, setDappUrl] = useState('')
  const [dappName, setDappName] = useState('')
  const [dappIconUrl, setDappIconUrl] = useState<string | undefined>(undefined)

  const activeAddress = useActiveAccountAddress()
  const connectedAddresses = useAppSelector(selectDappConnectedAddresses(dappUrl)) || []

  const isConnected = !!activeAddress && connectedAddresses.includes(activeAddress)

  useEffect(() => {
    const updateDappInfo = (): void => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0]
        if (tab) {
          setDappUrl(extractBaseUrl(tab?.url) || '')
          setDappName(tab?.title || '')
          setDappIconUrl(tab.favIconUrl)
        }
      })
    }

    updateDappInfo()

    const extensionId = chrome.runtime.id

    function tabChangedHandler(message: unknown, sender: chrome.runtime.MessageSender): void {
      if (
        sender.id === extensionId &&
        isValidMessage<{ type: BackgroundToExtensionRequestType }>(
          Object.values(BackgroundToExtensionRequestType),
          message
        ) &&
        message.type === BackgroundToExtensionRequestType.TabActivated
      ) {
        updateDappInfo()
      }
    }

    chrome.runtime.onMessage.addListener(tabChangedHandler)
    return () => chrome.runtime.onMessage.removeListener(tabChangedHandler)
  }, [setDappIconUrl, setDappUrl, setDappName])

  const value = { dappUrl, dappName, dappIconUrl, isConnected }

  return <DappContext.Provider value={value}>{children}</DappContext.Provider>
}

export function useDappContext(): DappContextState {
  const context = useContext(DappContext)

  if (context === undefined) {
    throw new Error('useDappContext must be used within a DappContextProvider')
  }

  return context
}
