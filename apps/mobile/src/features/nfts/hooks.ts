import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share } from 'react-native'
import { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName, ShareableEntity } from 'src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { selectNftsData } from 'wallet/src/features/favorites/selectors'
import { toggleNftVisibility } from 'wallet/src/features/favorites/slice'
import { shouldHideNft } from 'wallet/src/features/nfts/hooks'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { getNftUrl } from 'wallet/src/utils/linking'

interface NFTMenuParams {
  tokenId?: string
  contractAddress?: Address
  owner?: Address
  showNotification?: boolean
  isSpam?: boolean
}

export function useNFTMenu({
  contractAddress,
  tokenId,
  owner,
  showNotification = false,
  isSpam,
}: NFTMenuParams): {
  menuActions: Array<ContextMenuAction & { onPress: () => void }>
  onContextMenuPress: (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => void
  onlyShare: boolean
} {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const accounts = useAccounts()
  const isLocalAccount = owner && !!accounts[owner]

  const isAddressAndTokenOk = contractAddress && tokenId
  const nftsData = useAppSelector(selectNftsData)
  const hidden =
    owner &&
    isAddressAndTokenOk &&
    shouldHideNft({ nftsData, owner, contractAddress, tokenId, isSpam })

  const onPressShare = useCallback(async (): Promise<void> => {
    if (!contractAddress || !tokenId) {
      return
    }
    try {
      const url = getNftUrl(contractAddress, tokenId)
      await Share.share({
        message: url,
      })
      sendMobileAnalyticsEvent(MobileEventName.ShareButtonClicked, {
        entity: ShareableEntity.NftItem,
        url,
      })
    } catch (error) {
      logger.error(error, { tags: { file: 'nfts/hooks', function: 'useNFTMenu' } })
    }
  }, [contractAddress, tokenId])

  const onPressHiddenStatus = useCallback(() => {
    if (!owner || !contractAddress || !tokenId) {
      return
    }
    dispatch(
      toggleNftVisibility({
        owner,
        contractAddress,
        tokenId,
        isSpam,
      })
    )
    if (showNotification) {
      dispatch(
        pushNotification({
          type: AppNotificationType.AssetVisibility,
          visible: !hidden,
          hideDelay: 2 * ONE_SECOND_MS,
          assetName: 'NFT',
        })
      )
    }
  }, [contractAddress, dispatch, hidden, isSpam, owner, showNotification, tokenId])

  const menuActions = useMemo(
    () =>
      isAddressAndTokenOk
        ? [
            {
              title: t('common.button.share'),
              systemIcon: 'square.and.arrow.up',
              onPress: onPressShare,
            },
            ...((isLocalAccount && [
              {
                title: hidden
                  ? t('tokens.nfts.hidden.action.unhide')
                  : t('tokens.nfts.hidden.action.hide'),
                systemIcon: hidden ? 'eye' : 'eye.slash',
                destructive: !hidden,
                onPress: onPressHiddenStatus,
              },
            ]) ||
              []),
          ]
        : [],
    [isAddressAndTokenOk, t, onPressShare, isLocalAccount, hidden, onPressHiddenStatus]
  )

  const onContextMenuPress = useCallback(
    async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
      await menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions]
  )

  return { menuActions, onContextMenuPress, onlyShare: !!isAddressAndTokenOk && !isLocalAccount }
}
