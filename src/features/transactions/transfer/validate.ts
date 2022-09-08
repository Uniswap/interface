import { Currency } from '@uniswap/sdk-core'
import { TFunction } from 'react-i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'src/components/modals/types'
import { ChainId } from 'src/constants/chains'
import { NFTAsset } from 'src/features/nfts/types'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { currencyAddress } from 'src/utils/currencyId'

export type PartialDerivedTransferInfo = Pick<
  DerivedTransferInfo,
  'currencyBalances' | 'currencyAmounts' | 'recipient' | 'currencyIn' | 'nftIn' | 'chainId'
>

export function getTransferWarnings(t: TFunction, derivedTransferInfo: PartialDerivedTransferInfo) {
  const { currencyBalances, currencyAmounts, recipient, currencyIn, nftIn, chainId } =
    derivedTransferInfo

  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]
  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  const isMissingRequiredParams = checkIsMissingRequiredParams(
    currencyIn,
    nftIn,
    chainId,
    recipient,
    !!currencyAmountIn,
    !!currencyBalanceIn
  )

  const warnings: Warning[] = []
  // insufficient balance
  if (currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)) {
    warnings.push({
      type: WarningLabel.InsufficientFunds,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
      title: t('You don’t have enough {{ symbol }}.', {
        symbol: currencyAmountIn.currency?.symbol,
      }),
      message: t(
        "Your {{ symbol }} balance has decreased since you entered the amount you'd like to send",
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

const checkIsMissingRequiredParams = (
  currencyIn: Currency | undefined,
  nftIn: NFTAsset.Asset | undefined,
  chainId: ChainId | undefined,
  recipient: Address | undefined,
  hasCurrencyAmount: boolean,
  hasCurrencyBalance: boolean
) => {
  const tokenAddress = currencyIn ? currencyAddress(currencyIn) : nftIn?.asset_contract.address

  if (!tokenAddress || !chainId || !recipient) return true
  if (!currencyIn && !nftIn) return true
  if (currencyIn && (!hasCurrencyAmount || !hasCurrencyBalance)) return true
  return false
}
