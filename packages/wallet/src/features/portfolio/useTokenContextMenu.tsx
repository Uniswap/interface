import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent } from 'react-native'
import type {
  ContextMenuAction,
  ContextMenuOnPressNativeEvent,
} from 'react-native-context-menu-view'
import { GeneratedIcon, isWeb } from 'ui/src'
import { CoinConvert, Eye, EyeOff, ReceiveAlt, SendAction } from 'ui/src/components/icons'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { CurrencyId } from 'uniswap/src/types/currency'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { ChainId } from 'wallet/src/constants/chains'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { usePortfolioCacheUpdater } from 'wallet/src/features/dataApi/balances'
import { toggleTokenVisibility } from 'wallet/src/features/favorites/slice'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch } from 'wallet/src/state'
import {
  areCurrencyIdsEqual,
  currencyIdToAddress,
  currencyIdToChain,
} from 'wallet/src/utils/currencyId'

interface TokenMenuParams {
  currencyId: CurrencyId
  tokenSymbolForNotification?: Nullable<string>
  portfolioBalance?: Nullable<PortfolioBalance>
}

type MenuAction = ContextMenuAction & { onPress: () => void; Icon?: GeneratedIcon }

export function useTokenContextMenu({
  currencyId,
  tokenSymbolForNotification,
  portfolioBalance,
}: TokenMenuParams): {
  menuActions: Array<MenuAction>
  onContextMenuPress: (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => void
} {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const { navigateToSwapFlow, navigateToReceive, navigateToSend, handleShareToken } =
    useWalletNavigation()

  const activeAccountHoldsToken =
    portfolioBalance && areCurrencyIdsEqual(currencyId, portfolioBalance?.currencyInfo.currencyId)
  const isHidden = !!portfolioBalance?.isHidden

  const currencyAddress = currencyIdToAddress(currencyId)
  const currencyChainId = currencyIdToChain(currencyId) ?? ChainId.Mainnet

  const onPressSend = useCallback(() => {
    // Do not show warning modal speed-bump if user is trying to send tokens they own
    navigateToSend({ currencyAddress, chainId: currencyChainId })
  }, [currencyAddress, currencyChainId, navigateToSend])

  const onPressSwap = useCallback(
    (currencyField: CurrencyField) => {
      // Do not show warning modal speed-bump if user is trying to swap tokens they own
      navigateToSwapFlow({ currencyField, currencyAddress, currencyChainId })
    },
    [currencyAddress, currencyChainId, navigateToSwapFlow]
  )

  const onPressShare = useCallback(async () => {
    handleShareToken({ currencyId })
  }, [currencyId, handleShareToken])

  const updateCache = usePortfolioCacheUpdater(activeAccountAddress)

  const onPressHiddenStatus = useCallback(() => {
    /**
     * This update changes the parameters sent in the call to `portfolios`,
     * resulting in a full reload of the portfolio from the server.
     * To avoid the empty state while fetching the new portfolio, we manually
     * modify the current one in the cache.
     */
    updateCache(!isHidden, portfolioBalance ?? undefined)

    dispatch(toggleTokenVisibility({ currencyId: currencyId.toLowerCase(), isSpam: isHidden }))

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
  }, [currencyId, dispatch, isHidden, tokenSymbolForNotification, updateCache, portfolioBalance])

  const menuActions = useMemo(
    (): MenuAction[] => [
      {
        title: t('common.button.swap'),
        onPress: () => onPressSwap(CurrencyField.INPUT),
        ...(isWeb
          ? {
              Icon: CoinConvert,
            }
          : {
              systemIcon: 'rectangle.2.swap',
            }),
      },
      {
        title: t('common.button.send'),
        onPress: onPressSend,
        ...(isWeb
          ? {
              Icon: SendAction,
            }
          : { systemIcon: 'paperplane' }),
      },
      {
        title: t('common.button.receive'),
        onPress: navigateToReceive,
        ...(isWeb
          ? {
              Icon: ReceiveAlt,
            }
          : { systemIcon: 'qrcode' }),
      },
      ...(!isWeb
        ? [
            {
              title: t('common.button.share'),
              onPress: onPressShare,
              systemIcon: 'square.and.arrow.up',
            },
          ]
        : []),
      ...(activeAccountHoldsToken
        ? [
            {
              title: isHidden ? t('tokens.action.unhide') : t('tokens.action.hide'),
              destructive: !isHidden,
              onPress: onPressHiddenStatus,
              ...(isWeb
                ? {
                    Icon: isHidden ? Eye : EyeOff,
                  }
                : { systemIcon: isHidden ? 'eye' : 'eye.slash' }),
            },
          ]
        : []),
    ],
    [
      t,
      onPressSend,
      navigateToReceive,
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
