import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent } from 'react-native'
import { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useDispatch, useSelector } from 'react-redux'
import { GeneratedIcon, isWeb, useIsDarkMode } from 'ui/src'
import { Eye, EyeOff, Trash } from 'ui/src/components/icons'
import { UNIVERSE_CHAIN_LOGO } from 'uniswap/src/assets/chainLogos'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { reportNftSpamToSimpleHash } from 'uniswap/src/data/apiClients/simpleHashApi/SimpleHashApiClient'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { selectNftsVisibility } from 'uniswap/src/features/favorites/selectors'
import { toggleNftVisibility } from 'uniswap/src/features/favorites/slice'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { getIsNftHidden, getNFTAssetKey } from 'wallet/src/features/nfts/utils'
import { useAccounts, useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { getExplorerName } from 'wallet/src/utils/linking'

interface NFTMenuParams {
  tokenId?: string
  contractAddress?: Address
  owner?: Address
  showNotification?: boolean
  isSpam?: boolean
  chainId?: UniverseChainId
}

type MenuAction = ContextMenuAction & { onPress: () => void; Icon?: GeneratedIcon }

export function useNFTContextMenu({
  contractAddress,
  tokenId,
  owner,
  showNotification = false,
  isSpam,
  chainId,
}: NFTMenuParams): {
  menuActions: Array<MenuAction>
  onContextMenuPress: (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => void
  onlyShare: boolean
} {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const isDarkMode = useIsDarkMode()
  const isSelfReportSpamNFTEnabled = useFeatureFlag(FeatureFlags.SelfReportSpamNFTs)
  const account = useActiveAccountWithThrow()
  const isViewOnlyWallet = account.type === AccountType.Readonly

  const { handleShareNft, navigateToNftDetails } = useWalletNavigation()

  const accounts = useAccounts()
  const isLocalAccount = owner && !!accounts[owner]

  const nftVisibility = useSelector(selectNftsVisibility)
  const nftKey = contractAddress && tokenId ? getNFTAssetKey(contractAddress, tokenId) : undefined
  const hidden = getIsNftHidden({ contractAddress, tokenId, isSpam, nftVisibility })
  const networkName = chainId && UNIVERSE_CHAIN_INFO[chainId].label

  const onPressShare = useCallback(async (): Promise<void> => {
    if (!contractAddress || !tokenId) {
      return
    }
    handleShareNft({ contractAddress, tokenId })
  }, [contractAddress, handleShareNft, tokenId])

  const onPressReport = useCallback(async () => {
    if (!nftKey) {
      return
    }

    if (!hidden) {
      dispatch(toggleNftVisibility({ nftKey, isSpam: true }))
    }

    try {
      await reportNftSpamToSimpleHash({
        contractAddress,
        tokenId,
        networkName,
      })
    } catch (e) {
      logger.error(e, {
        tags: { file: 'useNftContextMenu.tsx', function: 'useSimpleHashNftReport' },
      })
      return
    }

    dispatch(
      pushNotification({
        type: AppNotificationType.Success,
        title: t('notification.spam.NFT.successful'),
      }),
    )
  }, [t, dispatch, contractAddress, hidden, networkName, nftKey, tokenId])

  const onPressHiddenStatus = useCallback(() => {
    if (!nftKey) {
      return
    }

    sendAnalyticsEvent(WalletEventName.NFTVisibilityChanged, {
      tokenId,
      chainId,
      contractAddress,
      isSpam,
      // we log the state to which it's transitioning
      visible: hidden,
    })
    dispatch(toggleNftVisibility({ nftKey, isSpam }))

    if (showNotification) {
      dispatch(
        pushNotification({
          type: AppNotificationType.AssetVisibility,
          visible: !hidden,
          hideDelay: 2 * ONE_SECOND_MS,
          assetName: 'NFT',
        }),
      )
    }
  }, [nftKey, dispatch, isSpam, tokenId, chainId, contractAddress, hidden, showNotification])

  const onPressNavigateToExplorer = useCallback(() => {
    if (contractAddress && tokenId && chainId) {
      navigateToNftDetails({ address: contractAddress, tokenId, chainId })
    }
  }, [contractAddress, tokenId, chainId, navigateToNftDetails])

  const menuActions = useMemo(
    () =>
      nftKey
        ? [
            ...(isWeb && chainId
              ? [
                  {
                    title: t('tokens.nfts.action.viewOnExplorer', { blockExplorerName: getExplorerName(chainId) }),
                    onPress: onPressNavigateToExplorer,
                    Icon: isDarkMode
                      ? UNIVERSE_CHAIN_LOGO[chainId].explorer.logoDark
                      : UNIVERSE_CHAIN_LOGO[chainId].explorer.logoLight,
                    destructive: false,
                  },
                ]
              : []),
            ...(!isWeb
              ? [
                  {
                    title: t('common.button.share'),
                    systemIcon: 'square.and.arrow.up',
                    onPress: onPressShare,
                  },
                ]
              : []),
            ...(isSelfReportSpamNFTEnabled && !isViewOnlyWallet
              ? [
                  {
                    title: t('nft.reportSpam'),
                    ...(isWeb
                      ? {
                          Icon: Trash,
                        }
                      : {
                          systemIcon: 'trash',
                        }),
                    destructive: true,
                    onPress: onPressReport,
                  },
                ]
              : []),
            ...((isLocalAccount && [
              {
                title: hidden ? t('tokens.nfts.hidden.action.unhide') : t('tokens.nfts.hidden.action.hide'),
                ...(isWeb
                  ? {
                      Icon: hidden ? Eye : EyeOff,
                    }
                  : {
                      systemIcon: hidden ? 'eye' : 'eye.slash',
                    }),
                destructive: !hidden,
                onPress: onPressHiddenStatus,
              },
            ]) ||
              []),
          ]
        : [],
    [
      nftKey,
      chainId,
      t,
      onPressNavigateToExplorer,
      isDarkMode,
      onPressShare,
      isLocalAccount,
      isViewOnlyWallet,
      hidden,
      isSelfReportSpamNFTEnabled,
      onPressHiddenStatus,
      onPressReport,
    ],
  )

  const onContextMenuPress = useCallback(
    async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
      await menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions],
  )

  return { menuActions, onContextMenuPress, onlyShare: !!nftKey && !isLocalAccount }
}
