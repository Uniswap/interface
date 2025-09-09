import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { Eye } from 'ui/src/components/icons/Eye'
import { EyeOff } from 'ui/src/components/icons/EyeOff'
import { Flag } from 'ui/src/components/icons/Flag'
import { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { TokenReportEventType, submitTokenReport } from 'uniswap/src/data/apiClients/dataApi/DataApiClient'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useBlockExplorerLogo } from 'uniswap/src/features/chains/logos'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainExplorerName } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { getIsNftHidden, getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { selectNftsVisibility } from 'uniswap/src/features/visibility/selectors'
import { setNftVisibility } from 'uniswap/src/features/visibility/slice'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { isWeb } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface NFTMenuParams {
  tokenId?: string
  contractAddress?: Address
  owner?: Address
  walletAddresses: Address[]
  showNotification?: boolean
  isSpam?: boolean
  chainId?: UniverseChainId
}

export function useNFTContextMenuItems({
  contractAddress,
  tokenId,
  owner,
  walletAddresses,
  showNotification = false,
  isSpam,
  chainId,
}: NFTMenuParams): MenuOptionItem[] {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { defaultChainId } = useEnabledChains()
  const isSelfReportSpamNFTEnabled = useFeatureFlag(FeatureFlags.SelfReportSpamNFTs)
  const { evmAccount } = useWallet()
  const isViewOnlyOwner = evmAccount && owner === evmAccount.address && evmAccount.accountType === AccountType.Readonly
  const ownedByUser = owner && walletAddresses.includes(owner)
  const showReportSpamOption = isSelfReportSpamNFTEnabled && ownedByUser && !isViewOnlyOwner && !isSpam

  const { navigateToNftDetails } = useUniswapContext()

  const nftVisibility = useSelector(selectNftsVisibility)
  const nftKey = contractAddress && tokenId ? getNFTAssetKey(contractAddress, tokenId) : undefined
  const isVisible = !getIsNftHidden({ contractAddress, tokenId, isSpam, nftVisibility })

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

      // Don't surface this error to the user if the chain ID isn't supported
      const error = e as { data?: { message?: string } }
      const unsupportedChainError = error.data?.message?.includes('Unsupported chain ID')

      if (unsupportedChainError) {
        return
      }

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
      navigateToNftDetails({ address: contractAddress, tokenId, chainId, fallbackChainId: defaultChainId })
    }
  }, [contractAddress, tokenId, chainId, navigateToNftDetails, defaultChainId])

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
    await openUri({
      uri: getExplorerLink({ chainId, data: contractAddress, type: ExplorerDataType.ADDRESS }),
    })
  }, [chainId, contractAddress])

  const ExplorerLogo = useBlockExplorerLogo(chainId)

  const menuActions = useMemo(
    () =>
      nftKey
        ? [
            ...(chainId
              ? [
                  {
                    label: t('tokens.nfts.action.viewOnExplorer', {
                      blockExplorerName: getChainExplorerName(chainId),
                    }),
                    onPress: isWeb ? onPressNavigateToExplorer : openExplorerLink,
                    Icon: ExplorerLogo,
                  },
                ]
              : []),
            ...(contractAddress
              ? [
                  {
                    label: t('common.copy.address'),
                    Icon: CopySheets,
                    onPress: onPressCopyAddress,
                  },
                ]
              : []),
            ...(ownedByUser
              ? [
                  {
                    label: isVisible ? t('tokens.nfts.hidden.action.hide') : t('tokens.nfts.hidden.action.unhide'),
                    Icon: isVisible ? EyeOff : Eye,
                    destructive: isVisible,
                    onPress: onPressHiddenStatus,
                  },
                ]
              : []),
            ...(showReportSpamOption
              ? [
                  {
                    label: t('nft.reportSpam'),
                    Icon: Flag,
                    destructive: true,
                    onPress: onPressReport,
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
      showReportSpamOption,
      onPressReport,
      ownedByUser,
      isVisible,
      onPressHiddenStatus,
    ],
  )

  return menuActions
}
