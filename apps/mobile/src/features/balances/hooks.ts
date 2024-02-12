import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, Share } from 'react-native'
import { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useAppDispatch } from 'src/app/hooks'
import { useNavigateToSend } from 'src/features/send/hooks'
import { useNavigateToSwap } from 'src/features/swap/hooks'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName, ShareableEntity } from 'src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { ChainId } from 'wallet/src/constants/chains'
import { usePortfolioCacheUpdater } from 'wallet/src/features/dataApi/balances'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { toggleTokenVisibility } from 'wallet/src/features/favorites/slice'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useCopyTokenAddressCallback } from 'wallet/src/features/tokens/hooks'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import {
  areCurrencyIdsEqual,
  CurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
} from 'wallet/src/utils/currencyId'
import { getTokenUrl } from 'wallet/src/utils/linking'

interface TokenMenuParams {
  currencyId: CurrencyId
  tokenSymbolForNotification?: Nullable<string>
  portfolioBalance?: Nullable<PortfolioBalance>
}

// Provide context menu related data for token
export function useTokenContextMenu({
  currencyId,
  tokenSymbolForNotification,
  portfolioBalance,
}: TokenMenuParams): {
  menuActions: Array<ContextMenuAction & { onPress: () => void }>
  onContextMenuPress: (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => void
} {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const navigateToSwap = useNavigateToSwap()
  const navigateToSend = useNavigateToSend()

  const activeAccountHoldsToken =
    portfolioBalance && areCurrencyIdsEqual(currencyId, portfolioBalance?.currencyInfo.currencyId)
  const isHidden = !!portfolioBalance?.isHidden

  const currencyAddress = currencyIdToAddress(currencyId)
  const currencyChainId = currencyIdToChain(currencyId) ?? ChainId.Mainnet

  const onPressCopyContractAddress = useCopyTokenAddressCallback(currencyAddress)

  const onPressSwap = useCallback(
    (currencyField: CurrencyField) => {
      // Do not show warning modal speedbump if user is trying to swap tokens they own
      navigateToSwap(currencyField, currencyAddress, currencyChainId)
    },
    [currencyAddress, currencyChainId, navigateToSwap]
  )

  const onPressSend = useCallback(() => {
    // Do not show warning modal speedbump if user is trying to send tokens they own
    navigateToSend(currencyAddress, currencyChainId)
  }, [currencyAddress, currencyChainId, navigateToSend])

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

  const updateCache = usePortfolioCacheUpdater(activeAccountAddress)

  const onPressHiddenStatus = useCallback(() => {
    /**
     * This update changes the parameters sent in the call to `portfolios`,
     * resulting in a full reload of the portfolio from the server.
     * To avoid the empty state while fetching the new portfolio, we manually
     * modify the current one in the cache.
     */
    updateCache(!isHidden, portfolioBalance ?? undefined)

    dispatch(
      toggleTokenVisibility({
        accountAddress: activeAccountAddress,
        currencyId: currencyId.toLowerCase(),
        currentlyVisible: !isHidden,
      })
    )
    if (tokenSymbolForNotification) {
      dispatch(
        pushNotification({
          type: AppNotificationType.AssetVisibility,
          visible: !isHidden,
          hideDelay: 2 * ONE_SECOND_MS,
          assetName: tokenSymbolForNotification,
        })
      )
    }
  }, [
    activeAccountAddress,
    currencyId,
    dispatch,
    isHidden,
    tokenSymbolForNotification,
    updateCache,
    portfolioBalance,
  ])

  const menuActions = useMemo(
    () => [
      {
        title: t('Buy'),
        systemIcon: 'arrow.down',
        onPress: () => onPressSwap(CurrencyField.OUTPUT),
      },
      {
        title: t('Sell'),
        systemIcon: 'arrow.up',
        onPress: () => onPressSwap(CurrencyField.INPUT),
      },
      {
        title: t('Send'),
        systemIcon: 'paperplane',
        onPress: onPressSend,
      },
      {
        title: t('Share'),
        systemIcon: 'square.and.arrow.up',
        onPress: onPressShare,
      },
      {
        title: t('Copy contract address'),
        systemIcon: 'doc.on.doc',
        onPress: onPressCopyContractAddress,
      },
      ...(activeAccountHoldsToken
        ? [
            {
              title: isHidden ? t('Unhide Token') : t('Hide Token'),
              systemIcon: isHidden ? 'eye' : 'eye.slash',
              destructive: !isHidden,
              onPress: onPressHiddenStatus,
            },
          ]
        : []),
    ],
    [
      t,
      onPressSend,
      onPressCopyContractAddress,
      onPressShare,
      activeAccountHoldsToken,
      isHidden,
      onPressHiddenStatus,
      onPressSwap,
    ]
  )

  const onContextMenuPress = useCallback(
    (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): void => {
      menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions]
  )

  return { menuActions, onContextMenuPress }
}
