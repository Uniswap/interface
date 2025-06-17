import { TFunction } from 'i18next'
import isEqual from 'lodash/isEqual'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { GQLNftAsset } from 'uniswap/src/features/nfts/types'
import { getNetworkWarning } from 'uniswap/src/features/transactions/hooks/useParsedTransactionWarnings'
import { DerivedSendInfo } from 'uniswap/src/features/transactions/send/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { useMemoCompare } from 'utilities/src/react/hooks'

export function getSendWarnings({
  t,
  derivedSendInfo,
  offline,
}: {
  t: TFunction
  derivedSendInfo: DerivedSendInfo
  offline: boolean
}): Warning[] {
  const warnings: Warning[] = []

  if (offline) {
    warnings.push(getNetworkWarning(t))
  }

  const { currencyBalances, currencyAmounts, recipient, currencyInInfo, nftIn, chainId } = derivedSendInfo

  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]
  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  const isMissingRequiredParams = checkIsMissingRequiredParams({
    currencyInInfo,
    nftIn,
    chainId: chainId as UniverseChainId,
    recipient,
    hasCurrencyAmount: !!currencyAmountIn,
    hasCurrencyBalance: !!currencyBalanceIn,
  })

  // insufficient balance
  if (currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)) {
    warnings.push({
      type: WarningLabel.InsufficientFunds,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
      title: t('send.warning.insufficientFunds.title', {
        currencySymbol: currencyAmountIn.currency.symbol,
      }),
      message: t('send.warning.insufficientFunds.message', {
        currencySymbol: currencyAmountIn.currency.symbol,
      }),
    })
  }

  // send form is missing fields
  if (isMissingRequiredParams) {
    warnings.push({
      type: WarningLabel.FormIncomplete,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
    })
  }

  return warnings
}

export function useSendWarnings(t: TFunction, derivedSendInfo: DerivedSendInfo): Warning[] {
  const offline = useIsOffline()

  return useMemoCompare(() => getSendWarnings({ t, derivedSendInfo, offline }), isEqual)
}

const checkIsMissingRequiredParams = ({
  currencyInInfo,
  nftIn,
  chainId,
  recipient,
  hasCurrencyAmount,
  hasCurrencyBalance,
}: {
  currencyInInfo: Maybe<CurrencyInfo>
  nftIn?: GQLNftAsset
  chainId?: UniverseChainId
  recipient?: Address
  hasCurrencyAmount: boolean
  hasCurrencyBalance: boolean
}): boolean => {
  const tokenAddress = currencyInInfo ? currencyAddress(currencyInInfo.currency) : nftIn?.nftContract?.address

  if (!tokenAddress || !chainId || !recipient) {
    return true
  }
  if (!currencyInInfo && !nftIn) {
    return true
  }
  if (currencyInInfo && (!hasCurrencyAmount || !hasCurrencyBalance)) {
    return true
  }
  return false
}
