import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useDappConnectedAccounts, useDappLastChainId } from 'src/app/features/dapp/hooks'
import { isConnectedAccount } from 'src/app/features/dapp/utils'
import { extractBaseUrl } from 'src/app/features/dappRequests/utils'
import { closePopup, PopupName } from 'src/app/features/popups/slice'
import { backgroundToSidePanelMessageChannel } from 'src/background/messagePassing/messageChannels'
import { BackgroundToSidePanelRequestType } from 'src/background/messagePassing/types/requests'
import { useAppDispatch } from 'src/store/store'
import { WalletChainId } from 'uniswap/src/types/chains'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

type DappContextState = {
  dappUrl: string
  dappIconUrl?: string
  isConnected: boolean
  lastChainId?: WalletChainId
}

const DappContext = createContext<DappContextState | undefined>(undefined)

export function DappContextProvider({ children }: { children: ReactNode }): JSX.Element {
  const [dappUrl, setDappUrl] = useState('')
  const [dappIconUrl, setDappIconUrl] = useState<string | undefined>(undefined)

  const activeAddress = useActiveAccountAddress()
  const connectedAccounts = useDappConnectedAccounts(dappUrl)
  const lastChainId = useDappLastChainId(dappUrl)
  const dispatch = useAppDispatch()

  const isConnected = !!activeAddress && isConnectedAccount(connectedAccounts, activeAddress)

  useEffect(() => {
    const updateDappInfo = (): void => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0]
        if (tab) {
          setDappUrl(extractBaseUrl(tab?.url) || '')
          setDappIconUrl(tab.favIconUrl)
        }
      })
    }

    updateDappInfo()

    return backgroundToSidePanelMessageChannel.addMessageListener(
      BackgroundToSidePanelRequestType.TabActivated,
      async (_message) => {
        updateDappInfo()
        dispatch(closePopup(PopupName.Connect))
      },
    )
  }, [setDappIconUrl, setDappUrl, dispatch])

  const value = { dappUrl, dappIconUrl, isConnected, lastChainId }

  return <DappContext.Provider value={value}>{children}</DappContext.Provider>
}

export function useDappContext(): DappContextState {
  const context = useContext(DappContext)

  if (context === undefined) {
    throw new Error('useDappContext must be used within a DappContextProvider')
  }

  return context
}
