import { TFunction } from 'i18next'
import isEqual from 'lodash/isEqual'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import type { PermissionedSendBlockReason } from 'uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked'
import { getNetworkWarning } from 'uniswap/src/features/transactions/hooks/useParsedTransactionWarnings'
import { DerivedSendInfo } from 'uniswap/src/features/transactions/send/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { useMemoCompare } from 'utilities/src/react/hooks'

// Send policy is owned by `useIsPermissionedSendBlocked`; this is a pure derivation.
// The block reason selects sender- vs recipient-specific copy.
function getPermissionedSendWarning({
  t,
  derivedSendInfo,
  isPermissionedSendBlocked,
  permissionedSendBlockReason,
}: {
  t: TFunction
  derivedSendInfo: DerivedSendInfo
  isPermissionedSendBlocked: boolean
  permissionedSendBlockReason?: PermissionedSendBlockReason
}): Warning | undefined {
  if (!isPermissionedSendBlocked) {
    return undefined
  }

  const currency = derivedSendInfo.currencyInInfo?.currency
  if (!currency) {
    return undefined
  }

  const tokenSymbol = currency.symbol ?? ''

  // 'sender' = the holder is no longer allowlisted (e.g. removed after acquiring the token).
  if (permissionedSendBlockReason === 'sender') {
    return {
      type: WarningLabel.PermissionedPool,
      severity: WarningSeverity.Blocked,
      action: WarningAction.DisableReview,
      title: t('permissionedPool.send.senderNotAllowlisted.title'),
      message: t('permissionedPool.send.senderNotAllowlisted.message', { tokenSymbol }),
    }
  }

  return {
    type: WarningLabel.PermissionedPool,
    severity: WarningSeverity.Blocked,
    action: WarningAction.DisableReview,
    title: t('permissionedPool.send.recipientNotAllowlisted.title'),
    message: t('permissionedPool.send.recipientNotAllowlisted.message', { tokenSymbol }),
  }
}

export function getSendWarnings({
  t,
  derivedSendInfo,
  offline,
  isPermissionedSendBlocked = false,
  isPermissionedSendBlockedLoading = false,
  permissionedSendBlockReason,
}: {
  t: TFunction
  derivedSendInfo: DerivedSendInfo
  offline: boolean
  isPermissionedSendBlocked?: boolean
  isPermissionedSendBlockedLoading?: boolean
  permissionedSendBlockReason?: PermissionedSendBlockReason
}): Warning[] {
  const warnings: Warning[] = []

  if (offline) {
    warnings.push(getNetworkWarning(t))
  }

  const permissionedWarning = getPermissionedSendWarning({
    t,
    derivedSendInfo,
    isPermissionedSendBlocked,
    permissionedSendBlockReason,
  })
  if (permissionedWarning) {
    warnings.push(permissionedWarning)
  } else if (isPermissionedSendBlockedLoading) {
    // Disable Review while we don't yet know whether the token is permissioned. No
    // user-facing copy: the warning text only appears once the API confirms a block.
    warnings.push({
      type: WarningLabel.FormIncomplete,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
    })
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
        currencySymbol: currencyAmountIn.currency.symbol ?? '',
      }),
      message: t('send.warning.insufficientFunds.message', {
        currencySymbol: currencyAmountIn.currency.symbol ?? '',
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

export function useSendWarnings({
  t,
  derivedSendInfo,
  isPermissionedSendBlocked,
  isPermissionedSendBlockedLoading,
  permissionedSendBlockReason,
}: {
  t: TFunction
  derivedSendInfo: DerivedSendInfo
  isPermissionedSendBlocked?: boolean
  isPermissionedSendBlockedLoading?: boolean
  permissionedSendBlockReason?: PermissionedSendBlockReason
}): Warning[] {
  const offline = useIsOffline()

  return useMemoCompare(
    () =>
      getSendWarnings({
        t,
        derivedSendInfo,
        offline,
        isPermissionedSendBlocked,
        isPermissionedSendBlockedLoading,
        permissionedSendBlockReason,
      }),
    isEqual,
  )
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
  nftIn?: NFTItem | undefined
  chainId?: UniverseChainId
  recipient?: Address
  hasCurrencyAmount: boolean
  hasCurrencyBalance: boolean
}): boolean => {
  const tokenAddress = currencyInInfo ? currencyAddress(currencyInInfo.currency) : nftIn?.contractAddress

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
