import { PropsWithChildren, useCallback } from 'react'
import { Share } from 'react-native'
import { useDispatch } from 'react-redux'
import { exploreNavigationRef } from 'src/app/navigation/navigation'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  useFiatOnRampAggregatorCountryListQuery,
  useFiatOnRampAggregatorGetCountryQuery,
} from 'uniswap/src/features/fiatOnRamp/api'
import { RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { ShareableEntity } from 'uniswap/src/types/sharing'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import {
  NavigateToExternalProfileArgs,
  NavigateToFiatOnRampArgs,
  NavigateToNftCollectionArgs,
  NavigateToNftItemArgs,
  NavigateToSendFlowArgs,
  NavigateToSwapFlowArgs,
  ShareNftArgs,
  ShareTokenArgs,
  WalletNavigationProvider,
  getNavigateToSendFlowArgsInitialState,
  getNavigateToSwapFlowArgsInitialState,
  isNavigateToSwapFlowArgsPartialState,
} from 'wallet/src/contexts/WalletNavigationContext'
import { getNftUrl, getTokenUrl } from 'wallet/src/utils/linking'

export function MobileWalletNavigationProvider({ children }: PropsWithChildren): JSX.Element {
  const handleShareNft = useHandleShareNft()
  const handleShareToken = useHandleShareToken()
  const navigateToAccountActivityList = useNavigateToHomepageTab(HomeScreenTabIndex.Activity)
  const navigateToAccountTokenList = useNavigateToHomepageTab(HomeScreenTabIndex.Tokens)
  const navigateToBuyOrReceiveWithEmptyWallet = useNavigateToBuyOrReceiveWithEmptyWallet()
  const navigateToNftCollection = useNavigateToNftCollection()
  const navigateToNftDetails = useNavigateToNftDetails()
  const navigateToReceive = useNavigateToReceive()
  const navigateToSend = useNavigateToSend()
  const navigateToSwapFlow = useNavigateToSwapFlow()
  const navigateToTokenDetails = useNavigateToTokenDetails()
  const navigateToFiatOnRamp = useNavigateToFiatOnRamp()
  const navigateToExternalProfile = useNavigateToExternalProfile()

  return (
    <WalletNavigationProvider
      handleShareNft={handleShareNft}
      handleShareToken={handleShareToken}
      navigateToAccountActivityList={navigateToAccountActivityList}
      navigateToAccountTokenList={navigateToAccountTokenList}
      navigateToBuyOrReceiveWithEmptyWallet={navigateToBuyOrReceiveWithEmptyWallet}
      navigateToExternalProfile={navigateToExternalProfile}
      navigateToFiatOnRamp={navigateToFiatOnRamp}
      navigateToNftCollection={navigateToNftCollection}
      navigateToNftDetails={navigateToNftDetails}
      navigateToReceive={navigateToReceive}
      navigateToSend={navigateToSend}
      navigateToSwapFlow={navigateToSwapFlow}
      navigateToTokenDetails={navigateToTokenDetails}
    >
      {children}
    </WalletNavigationProvider>
  )
}

function useHandleShareNft(): (args: ShareNftArgs) => Promise<void> {
  return useCallback(async ({ contractAddress, tokenId }: ShareNftArgs): Promise<void> => {
    try {
      const url = getNftUrl(contractAddress, tokenId)

      await Share.share({ message: url })

      sendAnalyticsEvent(WalletEventName.ShareButtonClicked, {
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

      sendAnalyticsEvent(WalletEventName.ShareButtonClicked, {
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
    navigate(MobileScreens.Home, { tab })
  }, [navigate, tab])
}

function useNavigateToReceive(): () => void {
  const dispatch = useDispatch()

  return useCallback((): void => {
    dispatch(openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr }))
  }, [dispatch])
}

function useNavigateToSend(): (args: NavigateToSendFlowArgs) => void {
  const dispatch = useDispatch()

  return useCallback(
    (args: NavigateToSendFlowArgs) => {
      const initialSendState = getNavigateToSendFlowArgsInitialState(args)
      dispatch(openModal({ name: ModalName.Send, initialState: initialSendState }))
    },
    [dispatch],
  )
}

function useNavigateToSwapFlow(): (args: NavigateToSwapFlowArgs) => void {
  const dispatch = useDispatch()
  const { defaultChainId } = useEnabledChains()

  return useCallback(
    (args: NavigateToSwapFlowArgs): void => {
      const initialState = getNavigateToSwapFlowArgsInitialState(args, defaultChainId)

      // If no prefilled token, go directly to swap
      if (!isNavigateToSwapFlowArgsPartialState(args)) {
        dispatch(closeModal({ name: ModalName.Swap }))
        dispatch(openModal({ name: ModalName.Swap, initialState }))
        return
      }

      // Show warning modal for prefilled tokens, which will handle token safety checks
      const currencyId = buildCurrencyId(args.currencyChainId, args.currencyAddress)
      dispatch(
        openModal({
          name: ModalName.TokenWarning,
          initialState: {
            currencyId,
            onAcknowledge: () => {
              dispatch(closeModal({ name: ModalName.TokenWarning }))
              dispatch(closeModal({ name: ModalName.Swap }))
              dispatch(openModal({ name: ModalName.Swap, initialState }))
            },
          },
        }),
      )
    },
    [dispatch, defaultChainId],
  )
}

function useNavigateToTokenDetails(): (currencyId: string) => void {
  const appNavigation = useAppStackNavigation()

  return useCallback(
    (currencyId: string): void => {
      if (exploreNavigationRef.isFocused()) {
        exploreNavigationRef.navigate(MobileScreens.TokenDetails, { currencyId })
      } else {
        appNavigation.navigate(MobileScreens.TokenDetails, { currencyId })
      }
    },
    [appNavigation],
  )
}

function useNavigateToNftDetails(): (args: NavigateToNftItemArgs) => void {
  const navigation = useAppStackNavigation()

  return useCallback(
    ({ owner, address, tokenId, isSpam, fallbackData }: NavigateToNftItemArgs): void => {
      navigation.navigate(MobileScreens.NFTItem, {
        owner,
        address,
        tokenId,
        isSpam,
        fallbackData,
      })
    },
    [navigation],
  )
}

function useNavigateToNftCollection(): (args: NavigateToNftCollectionArgs) => void {
  const navigation = useAppStackNavigation()

  return useCallback(
    ({ collectionAddress }: NavigateToNftCollectionArgs): void => {
      navigation.navigate(MobileScreens.NFTCollection, {
        collectionAddress,
      })
    },
    [navigation],
  )
}

function useNavigateToBuyOrReceiveWithEmptyWallet(): () => void {
  const dispatch = useDispatch()

  const { data: countryResult } = useFiatOnRampAggregatorGetCountryQuery()
  const { data: countryOptionsResult } = useFiatOnRampAggregatorCountryListQuery({
    rampDirection: RampDirection.ONRAMP,
  })
  const forAggregatorEnabled = countryOptionsResult?.supportedCountries.some(
    (c) => c.countryCode === countryResult?.countryCode,
  )

  return useCallback((): void => {
    dispatch(closeModal({ name: ModalName.Send }))

    if (forAggregatorEnabled) {
      dispatch(openModal({ name: ModalName.FiatOnRampAggregator }))
    } else {
      dispatch(
        openModal({
          name: ModalName.WalletConnectScan,
          initialState: ScannerModalState.WalletQr,
        }),
      )
    }
  }, [dispatch, forAggregatorEnabled])
}

function useNavigateToFiatOnRamp(): (args: NavigateToFiatOnRampArgs) => void {
  const dispatch = useDispatch()

  return useCallback(
    ({ prefilledCurrency, isOfframp }: NavigateToFiatOnRampArgs): void => {
      dispatch(openModal({ name: ModalName.FiatOnRampAggregator, initialState: { prefilledCurrency, isOfframp } }))
    },
    [dispatch],
  )
}

function useNavigateToExternalProfile(): (args: NavigateToExternalProfileArgs) => void {
  const appNavigation = useAppStackNavigation()

  return useCallback(
    ({ address }: NavigateToExternalProfileArgs): void => {
      if (exploreNavigationRef.isFocused()) {
        exploreNavigationRef.navigate(MobileScreens.ExternalProfile, { address })
      } else {
        appNavigation.navigate(MobileScreens.ExternalProfile, { address })
      }
    },
    [appNavigation],
  )
}
