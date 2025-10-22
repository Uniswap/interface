import { PropsWithChildren, useCallback } from 'react'
import { createSearchParams, useLocation, useNavigate } from 'react-router'
import { navigateToInterfaceFiatOnRamp } from 'src/app/features/for/utils'
import { AppRoutes, HomeQueryParams, HomeTabs } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import {
  focusOrCreateTokensExploreTab,
  focusOrCreateUniswapInterfaceTab,
  SidebarLocationState,
} from 'src/app/navigation/utils'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useNavigateToNftExplorerLink } from 'uniswap/src/features/nfts/hooks/useNavigateToNftExplorerLink'
import { CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ShareableEntity } from 'uniswap/src/types/sharing'
import { getPoolDetailsURL, getTokenUrl } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { escapeRegExp } from 'utilities/src/primitives/string'
import { noop } from 'utilities/src/react/noop'
import { useCopyToClipboard } from 'wallet/src/components/copy/useCopyToClipboard'
import {
  getNavigateToSendFlowArgsInitialState,
  getNavigateToSwapFlowArgsInitialState,
  NavigateToFiatOnRampArgs,
  NavigateToSendFlowArgs,
  NavigateToSwapFlowArgs,
  ShareTokenArgs,
  WalletNavigationContextState,
  WalletNavigationProvider,
} from 'wallet/src/contexts/WalletNavigationContext'

export function OnboardingNavigationProvider({ children }: PropsWithChildren): JSX.Element {
  return (
    <SharedExtensionNavigationProvider
      navigateToAccountActivityList={noop}
      navigateToAccountTokenList={noop}
      navigateToSwapFlow={noop}
    >
      {children}
    </SharedExtensionNavigationProvider>
  )
}

export function SidebarNavigationProvider({ children }: PropsWithChildren): JSX.Element {
  const navigateToAccountActivityList = useNavigateToAccountActivityList()
  const navigateToAccountTokenList = useNavigateToAccountTokenList()
  const navigateToSwapFlow = useNavigateToSwapFlow()

  return (
    <SharedExtensionNavigationProvider
      navigateToAccountActivityList={navigateToAccountActivityList}
      navigateToAccountTokenList={navigateToAccountTokenList}
      navigateToSwapFlow={navigateToSwapFlow}
    >
      {children}
    </SharedExtensionNavigationProvider>
  )
}

function SharedExtensionNavigationProvider({
  children,
  navigateToAccountActivityList,
  navigateToAccountTokenList,
  navigateToSwapFlow,
}: PropsWithChildren<
  Pick<
    WalletNavigationContextState,
    'navigateToAccountActivityList' | 'navigateToAccountTokenList' | 'navigateToSwapFlow'
  >
>): JSX.Element {
  const handleShareToken = useHandleShareToken()
  const navigateToBuyOrReceiveWithEmptyWallet = useNavigateToBuyOrReceiveWithEmptyWallet()
  const navigateToNftDetails = useNavigateToNftExplorerLink()
  const navigateToReceive = useNavigateToReceive()
  const navigateToSend = useNavigateToSend()
  const navigateToTokenDetails = useNavigateToTokenDetails()
  const navigateToNftCollection = useCallback(() => {
    // no-op until we have proper NFT collection
  }, [])
  const navigateToFiatOnRamp = useNavigateToFiatOnRamp()
  const navigateToExternalProfile = useCallback(() => {
    // no-op until we have an external profile screen on extension
  }, [])
  const navigateToPoolDetails = useNavigateToPoolDetails()

  return (
    <WalletNavigationProvider
      handleShareToken={handleShareToken}
      navigateToAccountActivityList={navigateToAccountActivityList}
      navigateToAccountTokenList={navigateToAccountTokenList}
      navigateToBuyOrReceiveWithEmptyWallet={navigateToBuyOrReceiveWithEmptyWallet}
      navigateToExternalProfile={navigateToExternalProfile}
      navigateToFiatOnRamp={navigateToFiatOnRamp}
      navigateToNftCollection={navigateToNftCollection}
      navigateToNftDetails={navigateToNftDetails}
      navigateToPoolDetails={navigateToPoolDetails}
      navigateToReceive={navigateToReceive}
      navigateToSend={navigateToSend}
      navigateToSwapFlow={navigateToSwapFlow}
      navigateToTokenDetails={navigateToTokenDetails}
    >
      {children}
    </WalletNavigationProvider>
  )
}

function useHandleShareToken(): (args: ShareTokenArgs) => void {
  const copyToClipboard = useCopyToClipboard()

  return useCallback(
    async ({ currencyId }: ShareTokenArgs): Promise<void> => {
      const url = getTokenUrl(currencyId)

      if (!url) {
        logger.error(new Error('Failed to get token URL'), {
          tags: { file: 'providers.tsx', function: 'useHandleShareToken' },
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
    (): void | Promise<void> =>
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
    (): void | Promise<void> =>
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
  return useCallback((): void => navigate(`/${AppRoutes.Receive}`), [])
}

function useNavigateToSend(): (args: NavigateToSendFlowArgs) => void {
  return useCallback((args: NavigateToSendFlowArgs): void => {
    const initialState = getNavigateToSendFlowArgsInitialState(args)

    const state: SidebarLocationState = args ? { initialTransactionState: initialState } : undefined

    navigate(`/${AppRoutes.Send}`, { state })
  }, [])
}

function useNavigateToSwapFlow(): (args: NavigateToSwapFlowArgs) => void {
  const { defaultChainId } = useEnabledChains()
  const location = useLocation()
  return useCallback(
    (args: NavigateToSwapFlowArgs): void => {
      const initialState = getNavigateToSwapFlowArgsInitialState(args, defaultChainId)

      const state: SidebarLocationState = initialState ? { initialTransactionState: initialState } : undefined

      const isCurrentlyOnSwap = location.pathname === `/${AppRoutes.Swap}`
      navigate(`/${AppRoutes.Swap}`, { state, replace: isCurrentlyOnSwap })
    },
    [defaultChainId, location.pathname],
  )
}

function useNavigateToTokenDetails(): (currencyId: string) => void {
  return useCallback(async (currencyId: string): Promise<void> => {
    await focusOrCreateTokensExploreTab({ currencyId })
  }, [])
}

function useNavigateToPoolDetails(): (args: { poolId: Address; chainId: UniverseChainId }) => void {
  return useCallback(async ({ poolId, chainId }: { poolId: Address; chainId: UniverseChainId }): Promise<void> => {
    await focusOrCreateUniswapInterfaceTab({
      url: getPoolDetailsURL(poolId, chainId),
      // We want to reuse the active tab only if it's already in any other PDP.
      // eslint-disable-next-line security/detect-non-literal-regexp
      reuseActiveTabIfItMatches: new RegExp(`^${escapeRegExp(uniswapUrls.webInterfacePoolsUrl)}`),
    })
  }, [])
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
