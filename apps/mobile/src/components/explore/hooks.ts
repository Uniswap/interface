import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share } from 'react-native'
import { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useSelectHasTokenFavorited, useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import {
  ElementName,
  MobileEventName,
  ModalName,
  SectionName,
  ShareableEntity,
} from 'src/features/telemetry/constants'
import { getTokenUrl } from 'src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import { useAppDispatch } from 'wallet/src/state'

import { CurrencyId, currencyIdToAddress } from 'wallet/src/utils/currencyId'

interface TokenMenuParams {
  currencyId: CurrencyId
  chainId: ChainId
  analyticsSection: SectionName
  // token, which are in favorite section would have it defined
  onEditFavorites?: () => void
}

// Provide context menu related data for token
export function useExploreTokenContextMenu({
  currencyId,
  chainId,
  analyticsSection,
  onEditFavorites,
}: TokenMenuParams): {
  menuActions: Array<ContextMenuAction & { onPress: () => void }>
  onContextMenuPress: (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => void
} {
  const { t } = useTranslation()
  const isFavorited = useSelectHasTokenFavorited(currencyId)
  const dispatch = useAppDispatch()

  const onPressShare = useCallback(async () => {
    const tokenUrl = getTokenUrl(currencyId)
    if (!tokenUrl) return
    try {
      await Share.share({
        message: tokenUrl,
      })
      sendMobileAnalyticsEvent(MobileEventName.ShareButtonClicked, {
        entity: ShareableEntity.Token,
        url: tokenUrl,
      })
    } catch (error) {
      logger.error(error, { tags: { file: 'balances/hooks.ts', function: 'onPressShare' } })
    }
  }, [currencyId])

  const toggleFavoriteToken = useToggleFavoriteCallback(currencyId, isFavorited)

  const onPressSwap = useCallback(() => {
    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '0',
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        chainId,
        // `address` is undefined for native currencies, so we want to extract it from
        // currencyId, where we have hardcoded addresses for native currencies
        address: currencyIdToAddress(currencyId),
        type: AssetType.Currency,
      },
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
    sendMobileAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.Swap,
      section: analyticsSection,
    })
  }, [analyticsSection, chainId, currencyId, dispatch])

  const onPressToggleFavorite = useCallback(() => {
    toggleFavoriteToken()
  }, [toggleFavoriteToken])

  const menuActions = useMemo(
    () => [
      {
        title: isFavorited ? t('Remove favorite') : t('Favorite token'),
        systemIcon: isFavorited ? 'heart.fill' : 'heart',
        onPress: onPressToggleFavorite,
      },
      ...(onEditFavorites
        ? [
            {
              title: t('Edit favorites'),
              systemIcon: 'square.and.pencil',
              onPress: onEditFavorites,
            },
          ]
        : []),
      { title: t('Swap'), systemIcon: 'arrow.2.squarepath', onPress: onPressSwap },
      ...(!onEditFavorites
        ? [
            {
              title: t('Share'),
              systemIcon: 'square.and.arrow.up',
              onPress: onPressShare,
            },
          ]
        : []),
    ],
    [onEditFavorites, isFavorited, onPressShare, onPressSwap, onPressToggleFavorite, t]
  )

  const onContextMenuPress = useCallback(
    async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
      await menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions]
  )

  return { menuActions, onContextMenuPress }
}
