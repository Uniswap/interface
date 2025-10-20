import { TokenReportEventType } from '@universe/api'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { Eye } from 'ui/src/components/icons/Eye'
import { EyeOff } from 'ui/src/components/icons/EyeOff'
import { Flag } from 'ui/src/components/icons/Flag'
import { Opensea } from 'ui/src/components/icons/Opensea'
import { type MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { DataServiceApiClient } from 'uniswap/src/data/apiClients/dataApi/DataApiClient'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useBlockExplorerLogo } from 'uniswap/src/features/chains/logos'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainExplorerName } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useNavigateToNftExplorerLink } from 'uniswap/src/features/nfts/hooks/useNavigateToNftExplorerLink'
import { getIsNftHidden, getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { selectNftsVisibility } from 'uniswap/src/features/visibility/selectors'
import { setNftVisibility } from 'uniswap/src/features/visibility/slice'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { getOpenseaLink, openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
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
  const navigateToNftExplorerLink = useNavigateToNftExplorerLink()
  const isSelfReportSpamNFTEnabled = useFeatureFlag(FeatureFlags.SelfReportSpamNFTs)
  const { evmAccount } = useWallet()
  const isViewOnlyOwner = evmAccount && owner === evmAccount.address && evmAccount.accountType === AccountType.Readonly
  const ownedByUser = owner && walletAddresses.includes(owner)
  const showReportSpamOption = isSelfReportSpamNFTEnabled && ownedByUser && !isViewOnlyOwner && !isSpam

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
      await DataServiceApiClient.submitTokenReport({
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

  const openseaUri = useMemo(() => {
    if (chainId && contractAddress && tokenId) {
      return getOpenseaLink({ chainId, contractAddress, tokenId })
    }
    return null
  }, [chainId, contractAddress, tokenId])

  const openOpenseaLink = useCallback(async () => {
    if (openseaUri) {
      await openUri({ uri: openseaUri })
    }
  }, [openseaUri])

  const openExplorerLink = useCallback(async () => {
    if (chainId && contractAddress && tokenId) {
      navigateToNftExplorerLink({ chainId, contractAddress, tokenId, fallbackChainId: defaultChainId })
    }
  }, [chainId, contractAddress, tokenId, navigateToNftExplorerLink, defaultChainId])

  const ExplorerLogo = useBlockExplorerLogo(chainId)

  const menuActions: MenuOptionItem[] = useMemo(() => {
    const actions: MenuOptionItem[] = []

    if (!nftKey) {
      return actions
    }

    if (chainId && contractAddress && tokenId) {
      actions.push({
        label: t('tokens.nfts.action.viewOnExplorer', {
          blockExplorerName: getChainExplorerName(chainId),
        }),
        onPress: openExplorerLink,
        Icon: ExplorerLogo,
        actionType: 'external-link',
      })
    }

    if (chainId && openseaUri) {
      actions.push({
        label: t('common.opensea.link'),
        onPress: openOpenseaLink,
        Icon: Opensea,
        actionType: 'external-link',
      })
    }

    if (contractAddress) {
      actions.push({
        label: t('common.copy.address'),
        Icon: CopySheets,
        onPress: onPressCopyAddress,
      })
    }

    if (ownedByUser) {
      actions.push({
        label: isVisible ? t('tokens.nfts.hidden.action.hide') : t('tokens.nfts.hidden.action.unhide'),
        Icon: isVisible ? EyeOff : Eye,
        destructive: isVisible,
        onPress: onPressHiddenStatus,
      })
    }

    if (showReportSpamOption) {
      actions.push({
        label: t('nft.reportSpam'),
        Icon: Flag,
        destructive: true,
        onPress: onPressReport,
      })
    }

    return actions
  }, [
    nftKey,
    chainId,
    contractAddress,
    tokenId,
    openseaUri,
    ownedByUser,
    showReportSpamOption,
    t,
    openExplorerLink,
    ExplorerLogo,
    openOpenseaLink,
    onPressCopyAddress,
    isVisible,
    onPressHiddenStatus,
    onPressReport,
  ])

  return menuActions
}
