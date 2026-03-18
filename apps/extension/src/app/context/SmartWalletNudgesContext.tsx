import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useGet5792DappInfo } from 'src/app/hooks/useGet5792DappInfo'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { extractUrlHost } from 'utilities/src/format/urls'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import {
  SmartWalletDelegationAction,
  useSmartWalletDelegationStatus,
} from 'wallet/src/components/smartWallet/smartAccounts/hooks'
import {
  selectHasSeenCreatedSmartWalletModal,
  selectHasShownEip5792Nudge,
} from 'wallet/src/features/behaviorHistory/selectors'
import {
  setHasSeenSmartWalletCreatedWalletModal,
  setHasShown5792Nudge,
} from 'wallet/src/features/behaviorHistory/slice'
import { useAccountCountChanged } from 'wallet/src/features/wallet/hooks'
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

  const openModal = useCallback((modal: ModalNameType): void => {
    setActiveModal(modal)
  }, [])

  const closeModal = useCallback((): void => {
    setActiveModal(null)
  }, [])

  const last5792DappInfo = useGet5792DappInfo()
  const delegationStatus = useSmartWalletDelegationStatus({ overrideAddress: last5792DappInfo?.activeConnectedAddress })
  const hasShownNudge = useSelector((state: WalletState) =>
    last5792DappInfo
      ? selectHasShownEip5792Nudge(state, last5792DappInfo.activeConnectedAddress, last5792DappInfo.url)
      : false,
  )
  // Check if home screen nudge was recently shown (24 hour cooldown)
  const lastHomeScreenShown = useSelector((state: WalletState) =>
    last5792DappInfo
      ? state.behaviorHistory.smartWalletNudge?.[last5792DappInfo.activeConnectedAddress]?.lastHomeScreenNudgeShown
      : undefined,
  )

  const hasRecentHomeScreenShown = lastHomeScreenShown ? Date.now() - lastHomeScreenShown < ONE_DAY_MS : false

  const shouldShowNudge =
    !hasShownNudge &&
    !hasRecentHomeScreenShown &&
    delegationStatus.status === SmartWalletDelegationAction.PromptUpgrade &&
    !delegationStatus.loading

  // biome-ignore lint/correctness/useExhaustiveDependencies: delegationStatus is used in shouldShowNudge calculation above
  useEffect(() => {
    if (last5792DappInfo && shouldShowNudge) {
      setDappInfo({
        icon: last5792DappInfo.iconUrl,
        name: last5792DappInfo.displayName || extractUrlHost(last5792DappInfo.url),
      })
      openModal(ModalName.SmartWalletNudge)
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
