import { useNetInfo } from '@react-native-community/netinfo'
import _ from 'lodash'
import { TFunction } from 'react-i18next'
import { getNetworkWarning } from 'src/components/modals/WarningModal/constants'
import {
  Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'src/components/modals/WarningModal/types'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { useMemoCompare } from 'utilities/src/react/hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { GQLNftAsset } from 'wallet/src/features/nfts/hooks'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { isOffline } from 'wallet/src/features/transactions/utils'
import { currencyAddress } from 'wallet/src/utils/currencyId'

export function getTransferWarnings(
  t: TFunction,
  derivedTransferInfo: DerivedTransferInfo,
  offline: boolean
): Warning[] {
  const warnings: Warning[] = []

  if (offline) {
    warnings.push(getNetworkWarning(t))
  }

  const { currencyBalances, currencyAmounts, recipient, currencyInInfo, nftIn, chainId } =
    derivedTransferInfo

  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]
  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  const isMissingRequiredParams = checkIsMissingRequiredParams(
    currencyInInfo,
    nftIn,
    chainId,
    recipient,
    !!currencyAmountIn,
    !!currencyBalanceIn
  )

  // insufficient balance
  if (currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)) {
    warnings.push({
      type: WarningLabel.InsufficientFunds,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
      title: t('Not enough {{ symbol }}.', {
        symbol: currencyAmountIn.currency?.symbol,
      }),
      message: t(
        'Your {{ symbol }} balance has decreased since you entered the amount you’d like to send',
        { symbol: currencyAmountIn.currency?.symbol }
      ),
    })
  }

  // transfer form is missing fields
  if (isMissingRequiredParams) {
    warnings.push({
      type: WarningLabel.FormIncomplete,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
    })
  }

  return warnings
}

export function useTransferWarnings(
  t: TFunction,
  derivedTransferInfo: DerivedTransferInfo
): Warning[] {
  const networkStatus = useNetInfo()
  // First `useNetInfo` call always results with unknown state,
  // which we want to ignore here until state is determined,
  // otherwise it leads to immediate re-renders of views dependent on useTransferWarnings.
  //
  // See for more here: https://github.com/react-native-netinfo/react-native-netinfo/pull/444
  const offline = isOffline(networkStatus)

  return useMemoCompare(() => getTransferWarnings(t, derivedTransferInfo, offline), _.isEqual)
}

const checkIsMissingRequiredParams = (
  currencyInInfo: Maybe<CurrencyInfo>,
  nftIn: GQLNftAsset | undefined,
  chainId: ChainId | undefined,
  recipient: Address | undefined,
  hasCurrencyAmount: boolean,
  hasCurrencyBalance: boolean
): boolean => {
  const tokenAddress = currencyInInfo
    ? currencyAddress(currencyInInfo.currency)
    : nftIn?.nftContract?.address

  if (!tokenAddress || !chainId || !recipient) return true
  if (!currencyInInfo && !nftIn) return true
  if (currencyInInfo && (!hasCurrencyAmount || !hasCurrencyBalance)) return true
  return false
}
