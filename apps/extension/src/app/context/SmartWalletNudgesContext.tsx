import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useGet5792DappInfo } from 'src/app/hooks/useGet5792DappInfo'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { selectHasSeenCreatedSmartWalletModal } from 'wallet/src/features/behaviorHistory/selectors'
import { setHasSeenSmartWalletCreatedWalletModal } from 'wallet/src/features/behaviorHistory/slice'
import { useAccountCountChanged } from 'wallet/src/features/wallet/hooks'

import { extractUrlHost } from 'utilities/src/format/urls'
import {
  SmartWalletDelegationAction,
  useSmartWalletDelegationStatus,
} from 'wallet/src/components/smartWallet/smartAccounts/hook'
import { selectHasShownEip5792Nudge } from 'wallet/src/features/behaviorHistory/selectors'
import { setHasShown5792Nudge } from 'wallet/src/features/behaviorHistory/slice'
import { WalletState } from 'wallet/src/state/walletReducer'

type DappInfo = {
  icon?: string
  name?: string
}

type SmartWalletNudgesContextState = {
  activeModal: ModalNameType | null
  openModal: (modal: ModalNameType) => void
  closeModal: () => void
  dappInfo?: DappInfo
  setDappInfo: (info?: DappInfo) => void
}

const SmartWalletNudgesContext = createContext<SmartWalletNudgesContextState | undefined>(undefined)

export function SmartWalletNudgesProvider({ children }: { children: ReactNode }): JSX.Element {
  const dispatch = useDispatch()

  const [activeModal, setActiveModal] = useState<ModalNameType | null>(null)
  const [dappInfo, setDappInfo] = useState<{
    icon?: string
    name?: string
  }>()

  const openModal = useCallback(
    (modal: ModalNameType): void => {
      setActiveModal(modal)
    },
    [setActiveModal],
  )

  const closeModal = useCallback((): void => {
    setActiveModal(null)
  }, [])

  const last5792DappInfo = useGet5792DappInfo()
  const delegationStatus = useSmartWalletDelegationStatus({ overrideAddress: last5792DappInfo?.activeConnectedAddress })
  const hasShownNudge = useSelector((state: WalletState) =>
    last5792DappInfo
      ? selectHasShownEip5792Nudge(state, last5792DappInfo?.activeConnectedAddress, last5792DappInfo?.url)
      : false,
  )

  const shouldShowNudge =
    !hasShownNudge && delegationStatus.status === SmartWalletDelegationAction.PromptUpgrade && !delegationStatus.loading

  useEffect(() => {
    if (last5792DappInfo && shouldShowNudge) {
      setDappInfo({
        icon: last5792DappInfo.iconUrl,
        name: last5792DappInfo.displayName || extractUrlHost(last5792DappInfo.url),
      })
      openModal(ModalName.PostSwapSmartWalletNudge)
      dispatch(
        setHasShown5792Nudge({
          walletAddress: last5792DappInfo.activeConnectedAddress,
          dappUrl: last5792DappInfo.url,
        }),
      )
    }
  }, [dispatch, last5792DappInfo, delegationStatus, openModal, shouldShowNudge])

  const hasSeenCreatedSmartWalletModal = useSelector(selectHasSeenCreatedSmartWalletModal)
  // Show SmartWalletEnabledModal when account count increases
  useAccountCountChanged(
    useEvent(() => {
      if (hasSeenCreatedSmartWalletModal) {
        return
      }
      setDappInfo(undefined)
      openModal(ModalName.SmartWalletCreatedModal)
      dispatch(setHasSeenSmartWalletCreatedWalletModal())
    }),
  )

  return (
    <SmartWalletNudgesContext.Provider
      value={{
        activeModal,
        openModal,
        closeModal,
        dappInfo,
        setDappInfo,
      }}
    >
      {children}
    </SmartWalletNudgesContext.Provider>
  )
}

export function useSmartWalletNudges(): SmartWalletNudgesContextState {
  const context = useContext(SmartWalletNudgesContext)
  if (!context) {
    throw new Error('useSmartWalletNudges must be used within a SmartWalletNudgesProvider')
  }
  return context
}
