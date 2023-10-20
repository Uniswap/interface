import { useEffect, useState } from 'react'
import { selectChainByDappAndWallet } from 'src/background/features/dapp/selectors'
import { extractBaseUrl } from 'src/background/features/dappRequests/utils'
import { useAppSelector } from 'src/background/store'
import { BackgroundToExtensionRequestType, BaseExtensionRequest } from 'src/types/requests'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

type DappContext = {
  dappUrl: string
  dappName: string
  dappIconUrl?: string
}

/** Hook to indicate whether the current dapp is connected to the active address. */
export function useIsDappConnected(): boolean {
  const { dappUrl } = useDappContext()
  const activeAddress = useActiveAccountAddress()

  return useAppSelector(selectChainByDappAndWallet(activeAddress, dappUrl)) !== undefined
}

/**
 * Hook used to get the dApp context. It updates whenever the current tab changes
 * TODO(EXT-358): turn this into a react context so there is just one instance of the message handler
 **/
export function useDappContext(): DappContext {
  const [dappUrl, setDappUrl] = useState('')
  const [dappName, setDappName] = useState('')
  const [dappIconUrl, setDappIconUrl] = useState<string | undefined>(undefined)

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

    const tabUpdatedListener = (request: BaseExtensionRequest): void => {
      if (request?.type === BackgroundToExtensionRequestType.TabActivated) {
        updateDappInfo()
      }
    }

    chrome.runtime.onMessage.addListener(tabUpdatedListener)
  }, [setDappIconUrl, setDappUrl, setDappName])

  return { dappUrl, dappName, dappIconUrl }
}
