import { PropsWithChildren, useCallback } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { HomeScreenTabIndex } from 'src/screens/HomeScreenTabIndex'
import { Screens } from 'src/screens/Screens'
import {
  NavigateToNftItemArgs,
  NavigateToSwapFlowArgs,
  WalletNavigationProvider,
} from 'wallet/src/contexts/WalletNavigationContext'
import { useFiatOnRampIpAddressQuery } from 'wallet/src/features/fiatOnRamp/api'
import { ModalName } from 'wallet/src/telemetry/constants'

export function MobileWalletNavigationProvider({ children }: PropsWithChildren): JSX.Element {
  const navigateToAccountActivityList = useNavigateToHomepageTab(HomeScreenTabIndex.Activity)
  const navigateToAccountTokenList = useNavigateToHomepageTab(HomeScreenTabIndex.Tokens)
  const navigateToBuyOrReceiveWithEmptyWallet = useNavigateToBuyOrReceiveWithEmptyWallet()
  const navigateToNftDetails = useNavigateToNftDetails()
  const navigateToSwapFlow = useNavigateToSwapFlow()
  const navigateToTokenDetails = useNavigateToTokenDetails()

  return (
    <WalletNavigationProvider
      navigateToAccountActivityList={navigateToAccountActivityList}
      navigateToAccountTokenList={navigateToAccountTokenList}
      navigateToBuyOrReceiveWithEmptyWallet={navigateToBuyOrReceiveWithEmptyWallet}
      navigateToNftDetails={navigateToNftDetails}
      navigateToSwapFlow={navigateToSwapFlow}
      navigateToTokenDetails={navigateToTokenDetails}>
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

function useNavigateToTokenDetails(): (currencyId: string) => void {
  const navigation = useAppStackNavigation()

  return useCallback(
    (currencyId: string): void => {
      navigation.navigate(Screens.TokenDetails, { currencyId })
    },
    [navigation]
  )
}

function useNavigateToNftDetails(): (args: NavigateToNftItemArgs) => void {
  const navigation = useAppStackNavigation()

  return useCallback(
    ({ owner, address, tokenId, isSpam, fallbackData }: NavigateToNftItemArgs): void => {
      navigation.navigate(Screens.NFTItem, {
        owner,
        address,
        tokenId,
        isSpam,
        fallbackData,
      })
    },
    [navigation]
  )
}

function useNavigateToBuyOrReceiveWithEmptyWallet(): () => void {
  const dispatch = useAppDispatch()

  const { data } = useFiatOnRampIpAddressQuery()
  const fiatOnRampEligible = Boolean(data?.isBuyAllowed)

  return useCallback((): void => {
    dispatch(closeModal({ name: ModalName.Send }))

    if (fiatOnRampEligible) {
      dispatch(openModal({ name: ModalName.FiatOnRamp }))
    } else {
      dispatch(
        openModal({
          name: ModalName.WalletConnectScan,
          initialState: ScannerModalState.WalletQr,
        })
      )
    }
  }, [dispatch, fiatOnRampEligible])
}
