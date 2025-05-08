import { PropsWithChildren, useCallback } from 'react'
import { createSearchParams, useNavigate } from 'react-router-dom'
import { navigateToInterfaceFiatOnRamp } from 'src/app/features/for/utils'
import { useCopyToClipboard } from 'src/app/hooks/useOnCopyToClipboard'
import { AppRoutes, HomeQueryParams, HomeTabs } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { SidebarLocationState, focusOrCreateTokensExploreTab } from 'src/app/navigation/utils'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ShareableEntity } from 'uniswap/src/types/sharing'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import {
  NavigateToFiatOnRampArgs,
  NavigateToNftItemArgs,
  NavigateToSendFlowArgs,
  NavigateToSwapFlowArgs,
  ShareNftArgs,
  ShareTokenArgs,
  WalletNavigationProvider,
  getNavigateToSendFlowArgsInitialState,
  getNavigateToSwapFlowArgsInitialState,
} from 'wallet/src/contexts/WalletNavigationContext'
import { getNftUrl, getTokenUrl } from 'wallet/src/utils/linking'

export function SideBarNavigationProvider({ children }: PropsWithChildren): JSX.Element {
  const handleShareNft = useHandleShareNft()
  const handleShareToken = useHandleShareToken()
  const navigateToAccountActivityList = useNavigateToAccountActivityList()
  const navigateToAccountTokenList = useNavigateToAccountTokenList()
  const navigateToBuyOrReceiveWithEmptyWallet = useNavigateToBuyOrReceiveWithEmptyWallet()
  const navigateToNftDetails = useNavigateToNftDetails()
  const navigateToReceive = useNavigateToReceive()
  const navigateToSend = useNavigateToSend()
  const navigateToSwapFlow = useNavigateToSwapFlow()
  const navigateToTokenDetails = useNavigateToTokenDetails()
  const navigateToNftCollection = useCallback(() => {
    // no-op until we have proper NFT collection
  }, [])
  const navigateToFiatOnRamp = useNavigateToFiatOnRamp()
  const navigateToExternalProfile = useCallback(() => {
    // no-op until we have an external profile screen on extension
  }, [])

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

function useHandleShareNft(): (args: ShareNftArgs) => void {
  const copyToClipboard = useCopyToClipboard()

  return useCallback(
    async ({ contractAddress, tokenId }: ShareNftArgs): Promise<void> => {
      const url = getNftUrl(contractAddress, tokenId)

      await copyToClipboard({ textToCopy: url, copyType: CopyNotificationType.NftUrl })

      sendAnalyticsEvent(WalletEventName.ShareButtonClicked, {
        entity: ShareableEntity.NftItem,
        url,
      })
    },
    [copyToClipboard],
  )
}

function useHandleShareToken(): (args: ShareTokenArgs) => void {
  const copyToClipboard = useCopyToClipboard()

  return useCallback(
    async ({ currencyId }: ShareTokenArgs): Promise<void> => {
      const url = getTokenUrl(currencyId)

      if (!url) {
        logger.error(new Error('Failed to get token URL'), {
          tags: { file: 'SideBarNavigationProvider.tsx', function: 'useHandleShareToken' },
          extra: { currencyId },
        })
        return
      }

      await copyToClipboard({ textToCopy: url, copyType: CopyNotificationType.TokenUrl })

      sendAnalyticsEvent(WalletEventName.ShareButtonClicked, {
        entity: ShareableEntity.Token,
        url,
      })
    },
    [copyToClipboard],
  )
}

function useNavigateToAccountActivityList(): () => void {
  // TODO(EXT-1029): determine why we need useNavigate here
  const navigateFix = useNavigate()

  return useCallback(
    (): void =>
      navigateFix({
        pathname: AppRoutes.Home,
        search: createSearchParams({
          [HomeQueryParams.Tab]: HomeTabs.Activity,
        }).toString(),
      }),
    [navigateFix],
  )
}

function useNavigateToAccountTokenList(): () => void {
  // TODO(EXT-1029): determine why we need useNavigate here
  const navigateFix = useNavigate()

  return useCallback(
    (): void =>
      navigateFix({
        pathname: AppRoutes.Home,
        search: createSearchParams({
          [HomeQueryParams.Tab]: HomeTabs.Tokens,
        }).toString(),
      }),
    [navigateFix],
  )
}

function useNavigateToReceive(): () => void {
  return useCallback((): void => navigate(AppRoutes.Receive), [])
}

function useNavigateToSend(): (args: NavigateToSendFlowArgs) => void {
  return useCallback((args: NavigateToSendFlowArgs): void => {
    const initialState = getNavigateToSendFlowArgsInitialState(args)

    const state: SidebarLocationState = args ? { initialTransactionState: initialState } : undefined

    navigate(AppRoutes.Send, { state })
  }, [])
}

function useNavigateToSwapFlow(): (args: NavigateToSwapFlowArgs) => void {
  const { defaultChainId } = useEnabledChains()
  return useCallback(
    (args: NavigateToSwapFlowArgs): void => {
      const initialState = getNavigateToSwapFlowArgsInitialState(args, defaultChainId)

      const state: SidebarLocationState = initialState ? { initialTransactionState: initialState } : undefined

      navigate(AppRoutes.Swap, { state })
    },
    [defaultChainId],
  )
}

function useNavigateToTokenDetails(): (currencyId: string) => void {
  return useCallback(async (currencyId: string): Promise<void> => {
    await focusOrCreateTokensExploreTab({ currencyId })
  }, [])
}

function useNavigateToNftDetails(): (args: NavigateToNftItemArgs) => void {
  const { defaultChainId } = useEnabledChains()
  return useCallback(
    ({ address, tokenId, chainId }: NavigateToNftItemArgs): void => {
      window.open(getExplorerLink(chainId ?? defaultChainId, `${address}/${tokenId}`, ExplorerDataType.NFT))
    },
    [defaultChainId],
  )
}

function useNavigateToBuyOrReceiveWithEmptyWallet(): () => void {
  return useCallback((): void => {
    navigateToInterfaceFiatOnRamp()
  }, [])
}

function useNavigateToFiatOnRamp(): (args: NavigateToFiatOnRampArgs) => void {
  return useCallback(({ prefilledCurrency }: NavigateToFiatOnRampArgs): void => {
    navigateToInterfaceFiatOnRamp(prefilledCurrency?.currencyInfo?.currency.chainId)
  }, [])
}
