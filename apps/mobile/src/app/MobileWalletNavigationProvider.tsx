import { PropsWithChildren, useCallback } from 'react'
import { Share } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { exploreNavigationRef } from 'src/app/navigation/navigation'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { HomeScreenTabIndex } from 'src/screens/HomeScreenTabIndex'
import { Screens } from 'src/screens/Screens'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { logger } from 'utilities/src/logger/logger'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import {
  NavigateToNftItemArgs,
  NavigateToSendFlowArgs,
  NavigateToSwapFlowArgs,
  ShareNftArgs,
  ShareTokenArgs,
  WalletNavigationProvider,
  getNavigateToSendFlowArgsInitialState,
  getNavigateToSwapFlowArgsInitialState,
} from 'wallet/src/contexts/WalletNavigationContext'
import { useFiatOnRampIpAddressQuery } from 'wallet/src/features/fiatOnRamp/api'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { ModalName, ShareableEntity, WalletEventName } from 'wallet/src/telemetry/constants'
import { getNftUrl, getTokenUrl } from 'wallet/src/utils/linking'

export function MobileWalletNavigationProvider({ children }: PropsWithChildren): JSX.Element {
  const handleShareNft = useHandleShareNft()
  const handleShareToken = useHandleShareToken()
  const navigateToAccountActivityList = useNavigateToHomepageTab(HomeScreenTabIndex.Activity)
  const navigateToAccountTokenList = useNavigateToHomepageTab(HomeScreenTabIndex.Tokens)
  const navigateToBuyOrReceiveWithEmptyWallet = useNavigateToBuyOrReceiveWithEmptyWallet()
  const navigateToNftDetails = useNavigateToNftDetails()
  const navigateToReceive = useNavigateToReceive()
  const navigateToSend = useNavigateToSend()
  const navigateToSwapFlow = useNavigateToSwapFlow()
  const navigateToTokenDetails = useNavigateToTokenDetails()

  return (
    <WalletNavigationProvider
      handleShareNft={handleShareNft}
      handleShareToken={handleShareToken}
      navigateToAccountActivityList={navigateToAccountActivityList}
      navigateToAccountTokenList={navigateToAccountTokenList}
      navigateToBuyOrReceiveWithEmptyWallet={navigateToBuyOrReceiveWithEmptyWallet}
      navigateToNftDetails={navigateToNftDetails}
      navigateToReceive={navigateToReceive}
      navigateToSend={navigateToSend}
      navigateToSwapFlow={navigateToSwapFlow}
      navigateToTokenDetails={navigateToTokenDetails}>
      {children}
    </WalletNavigationProvider>
  )
}

function useHandleShareNft(): (args: ShareNftArgs) => Promise<void> {
  return useCallback(async ({ contractAddress, tokenId }: ShareNftArgs): Promise<void> => {
    try {
      const url = getNftUrl(contractAddress, tokenId)

      await Share.share({ message: url })

      sendWalletAnalyticsEvent(WalletEventName.ShareButtonClicked, {
        entity: ShareableEntity.NftItem,
        url,
      })
    } catch (error) {
      logger.error(error, {
        tags: { file: 'MobileWalletNavigationProvider.tsx', function: 'useHandleShareNft' },
      })
    }
  }, [])
}

function useHandleShareToken(): (args: ShareTokenArgs) => Promise<void> {
  return useCallback(async ({ currencyId }: ShareTokenArgs): Promise<void> => {
    const url = getTokenUrl(currencyId, true)

    if (!url) {
      logger.error(new Error('Failed to get token URL'), {
        tags: { file: 'MobileWalletNavigationProvider.tsx', function: 'useHandleShareToken' },
        extra: { currencyId },
      })
      return
    }

    try {
      await Share.share({ message: url })

      sendWalletAnalyticsEvent(WalletEventName.ShareButtonClicked, {
        entity: ShareableEntity.Token,
        url,
      })
    } catch (error) {
      logger.error(error, {
        tags: { file: 'MobileWalletNavigationProvider.tsx', function: 'useHandleShareToken' },
      })
    }
  }, [])
}

function useNavigateToHomepageTab(tab: HomeScreenTabIndex): () => void {
  const { navigate } = useAppStackNavigation()

  return useCallback((): void => {
    navigate(Screens.Home, { tab })
  }, [navigate, tab])
}

function useNavigateToReceive(): () => void {
  const dispatch = useAppDispatch()

  return useCallback((): void => {
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
    )
  }, [dispatch])
}

function useNavigateToSend(): (args: NavigateToSendFlowArgs) => void {
  const dispatch = useAppDispatch()

  return useCallback(
    (args: NavigateToSendFlowArgs) => {
      const initialSendState = getNavigateToSendFlowArgsInitialState(args)
      dispatch(openModal({ name: ModalName.Send, initialState: initialSendState }))
    },
    [dispatch]
  )
}

function useNavigateToSwapFlow(): (args: NavigateToSwapFlowArgs) => void {
  const dispatch = useAppDispatch()

  return useCallback(
    (args: NavigateToSwapFlowArgs): void => {
      const initialState = getNavigateToSwapFlowArgsInitialState(args)
      dispatch(closeModal({ name: ModalName.Swap }))
      dispatch(openModal({ name: ModalName.Swap, initialState }))
    },
    [dispatch]
  )
}

function useNavigateToTokenDetails(): (currencyId: string) => void {
  const appNavigation = useAppStackNavigation()

  return useCallback(
    (currencyId: string): void => {
      if (exploreNavigationRef.isFocused()) {
        exploreNavigationRef.navigate(Screens.TokenDetails, { currencyId })
      } else {
        appNavigation.navigate(Screens.TokenDetails, { currencyId })
      }
    },
    [appNavigation]
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
  const moonpayFiatOnRampEligible = Boolean(data?.isBuyAllowed)
  const forAggregatorEnabled = useFeatureFlag(FeatureFlags.ForAggregator)

  return useCallback((): void => {
    dispatch(closeModal({ name: ModalName.Send }))

    if (forAggregatorEnabled) {
      dispatch(openModal({ name: ModalName.FiatOnRampAggregator }))
    } else if (moonpayFiatOnRampEligible) {
      dispatch(openModal({ name: ModalName.FiatOnRamp }))
    } else {
      dispatch(
        openModal({
          name: ModalName.WalletConnectScan,
          initialState: ScannerModalState.WalletQr,
        })
      )
    }
  }, [dispatch, forAggregatorEnabled, moonpayFiatOnRampEligible])
}
