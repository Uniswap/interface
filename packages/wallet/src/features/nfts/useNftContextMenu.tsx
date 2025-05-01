import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent } from 'react-native'
import { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useDispatch, useSelector } from 'react-redux'
import { GeneratedIcon, isWeb } from 'ui/src'
import { Eye, EyeOff, Flag } from 'ui/src/components/icons'
import { TokenReportEventType, submitTokenReport } from 'uniswap/src/data/apiClients/dataApi/DataApiClient'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useBlockExplorerLogo } from 'uniswap/src/features/chains/logos'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { selectNftsVisibility } from 'uniswap/src/features/visibility/selectors'
import { setNftVisibility } from 'uniswap/src/features/visibility/slice'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
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
} {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const isSelfReportSpamNFTEnabled = useFeatureFlag(FeatureFlags.SelfReportSpamNFTs)
  const account = useActiveAccountWithThrow()
  const isViewOnlyWallet = account.type === AccountType.Readonly

  const { handleShareNft, navigateToNftDetails } = useWalletNavigation()

  const accounts = useAccounts()
  const isLocalAccount = owner && !!accounts[owner]

  const nftVisibility = useSelector(selectNftsVisibility)
  const nftKey = contractAddress && tokenId ? getNFTAssetKey(contractAddress, tokenId) : undefined
  const isVisible = !getIsNftHidden({ contractAddress, tokenId, isSpam, nftVisibility })

  const onPressShare = useCallback(async (): Promise<void> => {
    if (!contractAddress || !tokenId) {
      return
    }
    handleShareNft({ contractAddress, tokenId })
  }, [contractAddress, handleShareNft, tokenId])

  const onPressReport = useCallback(async () => {
    if (!nftKey || !chainId || !contractAddress) {
      logger.warn('useNftContextMenu', 'onPressReport', 'Missing required parameters for reporting', {
        nftKey,
        chainId,
        contractAddress,
      })
      return
    }

    if (isVisible) {
      dispatch(setNftVisibility({ nftKey, isVisible: false }))
    }

    try {
      await submitTokenReport({
        chainId,
        address: contractAddress,
        event: TokenReportEventType.FalseNegative,
      })

      dispatch(
        pushNotification({
          type: AppNotificationType.Success,
          title: t('notification.spam.NFT.successful'),
        }),
      )
    } catch (e) {
      logger.error(e, {
        tags: { file: 'useNftContextMenu.tsx', function: 'onPressReport' },
      })

      dispatch(
        pushNotification({
          type: AppNotificationType.Error,
          errorMessage: t('notification.spam.NFT.failed'),
        }),
      )
      return
    }
  }, [t, dispatch, contractAddress, isVisible, chainId, nftKey])

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
      visible: !isVisible,
    })
    dispatch(setNftVisibility({ nftKey, isVisible: !isVisible }))

    if (showNotification) {
      dispatch(
        pushNotification({
          type: AppNotificationType.AssetVisibility,
          visible: isVisible,
          hideDelay: 2 * ONE_SECOND_MS,
          assetName: 'NFT',
        }),
      )
    }
  }, [nftKey, tokenId, chainId, contractAddress, isSpam, isVisible, dispatch, showNotification])

  const onPressNavigateToExplorer = useCallback(() => {
    if (contractAddress && tokenId && chainId) {
      navigateToNftDetails({ address: contractAddress, tokenId, chainId })
    }
  }, [contractAddress, tokenId, chainId, navigateToNftDetails])

  const onPressCopyAddress = useCallback(async (): Promise<void> => {
    if (!contractAddress) {
      return
    }
    await setClipboard(contractAddress)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      }),
    )
  }, [contractAddress, dispatch])

  const openExplorerLink = useCallback(async (): Promise<void> => {
    if (!chainId || !contractAddress) {
      return
    }
    await openUri(getExplorerLink(chainId, contractAddress, ExplorerDataType.ADDRESS))
  }, [chainId, contractAddress])

  const ExplorerLogo = useBlockExplorerLogo(chainId)

  const menuActions = useMemo(
    () =>
      nftKey
        ? [
            ...(isWeb && chainId
              ? [
                  {
                    title: t('tokens.nfts.action.viewOnExplorer', { blockExplorerName: getExplorerName(chainId) }),
                    onPress: onPressNavigateToExplorer,
                    Icon: ExplorerLogo,
                    destructive: false,
                  },
                ]
              : []),
            ...(!isWeb && chainId
              ? [
                  {
                    title: t('tokens.nfts.action.viewOnExplorer', { blockExplorerName: getExplorerName(chainId) }),
                    systemIcon: 'link',
                    onPress: openExplorerLink,
                  },
                ]
              : []),
            ...(contractAddress
              ? [
                  {
                    title: t('common.copy.address'),
                    systemIcon: 'doc.on.doc',
                    onPress: onPressCopyAddress,
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
                          Icon: Flag,
                        }
                      : {
                          systemIcon: 'flag',
                        }),
                    destructive: true,
                    onPress: onPressReport,
                  },
                ]
              : []),
            ...(isLocalAccount
              ? [
                  {
                    title: isVisible ? t('tokens.nfts.hidden.action.hide') : t('tokens.nfts.hidden.action.unhide'),
                    ...(isWeb
                      ? {
                          Icon: isVisible ? EyeOff : Eye,
                        }
                      : {
                          systemIcon: isVisible ? 'eye.slash' : 'eye',
                        }),
                    destructive: isVisible,
                    onPress: onPressHiddenStatus,
                  },
                ]
              : []),
          ]
        : [],
    [
      nftKey,
      chainId,
      t,
      onPressNavigateToExplorer,
      ExplorerLogo,
      openExplorerLink,
      contractAddress,
      onPressCopyAddress,
      onPressShare,
      isSelfReportSpamNFTEnabled,
      isViewOnlyWallet,
      onPressReport,
      isLocalAccount,
      isVisible,
      onPressHiddenStatus,
    ],
  )

  const onContextMenuPress = useCallback(
    async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
      await menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions],
  )

  return { menuActions, onContextMenuPress }
}
