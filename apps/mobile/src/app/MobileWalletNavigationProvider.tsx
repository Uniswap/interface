import { PropsWithChildren, useCallback } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { HomeScreenTabIndex } from 'src/screens/HomeScreenTabIndex'
import { Screens } from 'src/screens/Screens'
import {
  NavigateToSwapFlowArgs,
  WalletNavigationProvider,
} from 'wallet/src/contexts/WalletNavigationContext'
import { ModalName } from 'wallet/src/telemetry/constants'

export function MobileWalletNavigationProvider({ children }: PropsWithChildren): JSX.Element {
  const navigateToAccountTokenList = useNavigateToHomepageTab(HomeScreenTabIndex.Tokens)
  const navigateToAccountActivityList = useNavigateToHomepageTab(HomeScreenTabIndex.Activity)
  const navigateToSwapFlow = useNavigateToSwapFlow()

  return (
    <WalletNavigationProvider
      navigateToAccountActivityList={navigateToAccountActivityList}
      navigateToAccountTokenList={navigateToAccountTokenList}
      navigateToSwapFlow={navigateToSwapFlow}>
      {children}
    </WalletNavigationProvider>
  )
}

function useNavigateToHomepageTab(tab: HomeScreenTabIndex): () => void {
  const { navigate } = useAppStackNavigation()

  return useCallback((): void => {
    navigate(Screens.Home, { tab })
  }, [navigate, tab])
}

function useNavigateToSwapFlow(): (args: NavigateToSwapFlowArgs) => void {
  const dispatch = useAppDispatch()

  return useCallback(
    (args: NavigateToSwapFlowArgs): void => {
      const initialState = args?.initialState

      dispatch(closeModal({ name: ModalName.Swap }))
      dispatch(openModal({ name: ModalName.Swap, initialState }))
    },
    [dispatch]
  )
}
