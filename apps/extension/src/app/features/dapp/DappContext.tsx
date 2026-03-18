import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { updateDisplayNameFromTab } from 'src/app/features/dapp/actions'
import { useDappConnectedAccounts, useDappLastChainId } from 'src/app/features/dapp/hooks'
import { dappStore } from 'src/app/features/dapp/store'
import { isConnectedAccount } from 'src/app/features/dapp/utils'
import { closePopup, PopupName } from 'src/app/features/popups/slice'
import { backgroundToSidePanelMessageChannel } from 'src/background/messagePassing/messageChannels'
import { BackgroundToSidePanelRequestType } from 'src/background/messagePassing/types/requests'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { extractBaseUrl } from 'utilities/src/format/urls'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

type DappContextState = {
  dappUrl: string
  dappIconUrl?: string
  isConnected: boolean
  lastChainId?: UniverseChainId
}

const DappContext = createContext<DappContextState | undefined>(undefined)

export function DappContextProvider({ children }: { children: ReactNode }): JSX.Element {
  const [dappUrl, setDappUrl] = useState('')
  const [dappIconUrl, setDappIconUrl] = useState<string | undefined>(undefined)

  const activeAddress = useActiveAccountAddress()
  const connectedAccounts = useDappConnectedAccounts(dappUrl)
  const lastChainId = useDappLastChainId(dappUrl)
  const dispatch = useDispatch()

  const isConnected = !!activeAddress && isConnectedAccount(connectedAccounts, activeAddress)

  useEffect(() => {
    const updateDappInfo = async (): Promise<void> => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (tab) {
        const newDappUrl = extractBaseUrl(tab.url)
        setDappUrl(newDappUrl || '')
        setDappIconUrl(tab.favIconUrl)

        if (!newDappUrl) {
          return
        }

        dappStore.updateDappIconUrl(newDappUrl, tab.favIconUrl)
        await updateDisplayNameFromTab(newDappUrl)
      }
    }

    // need to update dapp info on mount
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateDappInfo()

    return backgroundToSidePanelMessageChannel.addMessageListener(
      BackgroundToSidePanelRequestType.TabActivated,
      async (_message) => {
        await updateDappInfo()
        dispatch(closePopup(PopupName.Connect))
      },
    )
  }, [dispatch])

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
