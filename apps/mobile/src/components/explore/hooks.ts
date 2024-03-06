import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share, ViewStyle } from 'react-native'
import { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import {
  AnimateStyle,
  SharedValue,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { useSelectHasTokenFavorited, useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName, ShareableEntity } from 'src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import { useAppDispatch } from 'wallet/src/state'
import { ElementName, ModalName, SectionNameType } from 'wallet/src/telemetry/constants'
import { CurrencyId, currencyIdToAddress } from 'wallet/src/utils/currencyId'
import { getTokenUrl } from 'wallet/src/utils/linking'

interface TokenMenuParams {
  currencyId: CurrencyId
  chainId: ChainId
  analyticsSection: SectionNameType
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

  // `address` is undefined for native currencies, so we want to extract it from
  // currencyId, where we have hardcoded addresses for native currencies
  const currencyAddress = currencyIdToAddress(currencyId)

  const onPressReceive = useCallback(
    () =>
      dispatch(
        openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
      ),
    [dispatch]
  )

  const onPressShare = useCallback(async () => {
    const tokenUrl = getTokenUrl(currencyId)
    if (!tokenUrl) {
      return
    }
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
        address: currencyAddress,
        type: AssetType.Currency,
      },
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
    sendMobileAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.Swap,
      section: analyticsSection,
    })
  }, [analyticsSection, chainId, currencyAddress, dispatch])

  const onPressToggleFavorite = useCallback(() => {
    toggleFavoriteToken()
  }, [toggleFavoriteToken])

  const menuActions = useMemo(
    () => [
      {
        title: isFavorited
          ? t('explore.tokens.favorite.action.remove')
          : t('explore.tokens.favorite.action.add'),
        systemIcon: isFavorited ? 'heart.fill' : 'heart',
        onPress: onPressToggleFavorite,
      },
      ...(onEditFavorites
        ? [
            {
              title: t('explore.tokens.favorite.action.edit'),
              systemIcon: 'square.and.pencil',
              onPress: onEditFavorites,
            },
          ]
        : []),
      { title: t('common.button.swap'), systemIcon: 'arrow.2.squarepath', onPress: onPressSwap },
      {
        title: t('common.button.receive'),
        systemIcon: 'qrcode',
        onPress: onPressReceive,
      },
      ...(!onEditFavorites
        ? [
            {
              title: t('common.button.share'),
              systemIcon: 'square.and.arrow.up',
              onPress: onPressShare,
            },
          ]
        : []),
    ],
    [
      isFavorited,
      t,
      onPressToggleFavorite,
      onEditFavorites,
      onPressSwap,
      onPressReceive,
      onPressShare,
    ]
  )

  const onContextMenuPress = useCallback(
    async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
      await menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions]
  )

  return { menuActions, onContextMenuPress }
}

export function useAnimatedCardDragStyle(
  isTouched: SharedValue<boolean>,
  dragActivationProgress: SharedValue<number>
): AnimateStyle<ViewStyle> {
  const wasTouched = useSharedValue(false)
  const dragAnimationProgress = useSharedValue(0)

  useAnimatedReaction(
    () => dragActivationProgress.value,
    (activationProgress, prev) => {
      const prevActivationProgress = prev ?? 0
      // If the activation progress is increasing (the user is touching one of the cards)
      if (activationProgress > prevActivationProgress) {
        if (isTouched.value) {
          // If the current card is the one being touched, reset the animation progress
          wasTouched.value = true
          dragAnimationProgress.value = 0
        } else {
          // Otherwise, animate the card
          wasTouched.value = false
          dragAnimationProgress.value = activationProgress
        }
      }
      // If the activation progress is decreasing (the user is no longer touching one of the cards)
      else {
        if (isTouched.value || wasTouched.value) {
          // If the current card is the one that was being touched, reset the animation progress
          dragAnimationProgress.value = 0
        } else {
          // Otherwise, animate the card
          dragAnimationProgress.value = activationProgress
        }
      }
    }
  )

  return useAnimatedStyle(() => ({
    opacity: interpolate(dragAnimationProgress.value, [0, 1], [1, 0.5]),
  }))
}
