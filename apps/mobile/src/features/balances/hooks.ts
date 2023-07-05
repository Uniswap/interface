import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent } from 'react-native'
import { ContextMenuAction, ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { selectTokensVisibility } from 'src/features/favorites/selectors'
import { toggleTokenVisibility, TokenVisibility } from 'src/features/favorites/slice'
import { useSelectLocalTxCurrencyIds } from 'src/features/transactions/hooks'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import {
  useAccounts,
  useSelectAccountHideSmallBalances,
  useSelectAccountHideSpamTokens,
} from 'wallet/src/features/wallet/hooks'
import { CurrencyId } from 'wallet/src/utils/currencyId'
import { ONE_SECOND_MS } from 'wallet/src/utils/time'

interface TokenMenuParams {
  currencyId: CurrencyId
  owner: Address
  isSpam: Maybe<boolean>
  isNative: Maybe<boolean>
  balanceUSD: Maybe<number>
  tokenSymbolForNotification?: Nullable<string>
}

const HIDE_SMALL_USD_BALANCES_THRESHOLD = 1

export const HIDDEN_TOKEN_BALANCES_ROW = 'HIDDEN_TOKEN_BALANCES_ROW'

/**
 * Checks if a token balance should be hidden.
 *
 * @param hideSpamTokens - Indicates whether to hide spam tokens.
 * @param hideSmallBalances - Indicates whether to hide tokens with small balances.
 * @param isSpam - The spam status of the token, which could be undefined.
 * @param balanceUSD - The balance of the token in USD, which could be undefined.
 * @param tokenVisibility - Optional parameter that includes data about token's visibility.
 * @param isSentOrSwappedLocally - Indicates if the token has been sent or swapped locally.
 *
 * @returns {boolean} - Returns true if the token balance should be hidden, false otherwise.
 *
 * @example
 * const isHidden = isTokenBalanceHidden({ hideSpamTokens, hideSmallBalances, isSpam, balanceUSD });
 */
function isTokenBalanceHidden({
  hideSpamTokens,
  hideSmallBalances,
  isSpam,
  isNative,
  balanceUSD,
  tokenVisibility,
  isSentOrSwappedLocally,
}: {
  hideSpamTokens: boolean
  hideSmallBalances: boolean
  isSpam: Maybe<boolean>
  isNative: Maybe<boolean>
  balanceUSD: Maybe<number>
  tokenVisibility?: TokenVisibility
  isSentOrSwappedLocally: Maybe<boolean>
}): boolean {
  // If user has explicity set visibility then always follow their preference
  if (tokenVisibility !== undefined) return !tokenVisibility.isVisible

  // If the user has sent or swapped a given token before then do not hide it by default
  if (isSentOrSwappedLocally) return false

  const shouldHideSpam = hideSpamTokens && isSpam
  const isSmallBalance = !balanceUSD || balanceUSD < HIDE_SMALL_USD_BALANCES_THRESHOLD
  const shouldHideSmallBalance = hideSmallBalances && isSmallBalance && isNative === false

  // Hide a token by default if it is spam or a non-native token with a small balance
  return shouldHideSpam || shouldHideSmallBalance
}

function useAccountTokensVisibilitySettings(owner: Address): {
  hideSpamTokens: boolean
  hideSmallBalances: boolean
  accountTokensVisibility?: Record<string, TokenVisibility>
  sentOrSwappedLocally: Record<string, boolean>
} {
  const hideSmallBalances = useSelectAccountHideSmallBalances(owner)
  const hideSpamTokens = useSelectAccountHideSpamTokens(owner)
  const sentOrSwappedLocally = useSelectLocalTxCurrencyIds(owner)
  const tokensVisibility = useAppSelector(selectTokensVisibility)
  return {
    hideSmallBalances,
    hideSpamTokens,
    accountTokensVisibility: tokensVisibility[owner],
    sentOrSwappedLocally,
  }
}

// Provide context menu related data for token balance
export function useTokenBalanceContextMenu({
  currencyId,
  owner,
  isSpam,
  isNative,
  balanceUSD,
  tokenSymbolForNotification,
}: TokenMenuParams): {
  menuActions: Array<ContextMenuAction & { onPress: () => void }>
  onContextMenuPress: (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => void
} {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { hideSmallBalances, hideSpamTokens, accountTokensVisibility, sentOrSwappedLocally } =
    useAccountTokensVisibilitySettings(owner)
  const isHidden = isTokenBalanceHidden({
    tokenVisibility: accountTokensVisibility?.[currencyId],
    isSentOrSwappedLocally: sentOrSwappedLocally[currencyId],
    hideSpamTokens,
    hideSmallBalances,
    isSpam,
    isNative,
    balanceUSD,
  })

  const accounts = useAccounts()
  const isLocalAccount = !!accounts[owner]

  const menuActions = useMemo(
    () => [
      ...(isLocalAccount
        ? [
            {
              title: isHidden ? t('Unhide Token') : t('Hide Token'),
              systemIcon: isHidden ? 'eye' : 'eye.slash',
              destructive: !isHidden,
              onPress: (): void => {
                dispatch(
                  toggleTokenVisibility({
                    owner,
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
              },
            },
          ]
        : []),
    ],
    [isLocalAccount, isHidden, t, dispatch, owner, currencyId, tokenSymbolForNotification]
  )

  const onContextMenuPress = useCallback(
    (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): void => {
      menuActions[e.nativeEvent.index]?.onPress?.()
    },
    [menuActions]
  )

  return { menuActions, onContextMenuPress }
}

/**
 * Custom hook to group Token Balances fetched from API to visible and hidden.
 *
 * @param balancesById - An object where keys are token ids and values are the corresponding balances. May be undefined.
 * @param expandHiddenTokens - Boolean flag to indicate if hidden tokens should be expanded.
 * @param owner - The owner address for which token balances are managed.
 *
 * @returns {object} An object containing two fields:
 *  - `tokens`: an array of tokens which could be a mix of PortfolioBalance instances or string (presumably token ids).
 *  - `numHidden`: the number of hidden tokens.
 *
 * @example
 * const { tokens, numHidden } = useGroupTokenBalancesByVisibility({ balancesById, expandHiddenTokens, owner });
 */
export function useTokenBalancesGroupedByVisibility({
  balancesById,
  expandHiddenTokens,
  owner,
}: {
  balancesById?: Record<string, PortfolioBalance>
  expandHiddenTokens: boolean
  owner: Address
}): {
  tokens: Array<PortfolioBalance | string>
  numHidden: number
} {
  const { hideSmallBalances, hideSpamTokens, accountTokensVisibility, sentOrSwappedLocally } =
    useAccountTokensVisibilitySettings(owner)

  return useMemo(() => {
    if (!balancesById) return { tokens: [], numHidden: 0 }

    const { shown, hidden } = Object.values(balancesById).reduce<{
      shown: PortfolioBalance[]
      hidden: PortfolioBalance[]
    }>(
      (acc, balance) => {
        const isHidden = isTokenBalanceHidden({
          tokenVisibility: accountTokensVisibility?.[balance.currencyInfo.currencyId],
          isSentOrSwappedLocally: sentOrSwappedLocally[balance.currencyInfo.currencyId],
          hideSpamTokens,
          hideSmallBalances,
          balanceUSD: balance.balanceUSD,
          isSpam: balance.currencyInfo.isSpam,
          isNative: balance.currencyInfo.currency.isNative,
        })

        if (isHidden) {
          acc.hidden.push(balance)
        } else {
          acc.shown.push(balance)
        }
        return acc
      },
      { shown: [], hidden: [] }
    )
    return {
      tokens: [
        ...shown,
        ...(hidden.length ? [HIDDEN_TOKEN_BALANCES_ROW] : []),
        ...(expandHiddenTokens ? hidden : []),
      ],
      numHidden: hidden.length,
    }
  }, [
    balancesById,
    expandHiddenTokens,
    accountTokensVisibility,
    sentOrSwappedLocally,
    hideSpamTokens,
    hideSmallBalances,
  ])
}
