import { CurrencyTransferContent } from 'uniswap/src/components/activity/details/transactions/TransferTransactionDetails'
import { useFormattedCurrencyAmountAndUSDValue } from 'uniswap/src/components/activity/hooks/useFormattedCurrencyAmountAndUSDValue'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  AuctionBidTransactionInfo,
  AuctionClaimedTransactionInfo,
  AuctionExitedTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

export function AuctionTransactionDetails({
  transactionDetails,
  typeInfo,
  onClose,
}: {
  transactionDetails: TransactionDetails
  typeInfo: AuctionBidTransactionInfo | AuctionClaimedTransactionInfo | AuctionExitedTransactionInfo
  onClose: () => void
}): JSX.Element {
  const formatter = useLocalizationContext()

  const tokenAddress = typeInfo.type === TransactionType.AuctionBid ? typeInfo.bidTokenAddress : typeInfo.tokenAddress

  const currencyInfo = useCurrencyInfo(buildCurrencyId(transactionDetails.chainId, tokenAddress))

  const { amount, value } = useFormattedCurrencyAmountAndUSDValue({
    currency: currencyInfo?.currency,
    currencyAmountRaw: typeInfo.amountRaw,
    formatter,
    isApproximateAmount: false,
  })

  const symbol = getSymbolDisplayText(currencyInfo?.currency.symbol)
  const tokenAmountWithSymbol = symbol ? amount + ' ' + symbol : amount

  return (
    <CurrencyTransferContent
      currencyInfo={currencyInfo}
      tokenAmountWithSymbol={tokenAmountWithSymbol}
      value={value}
      onClose={onClose}
    />
  )
}
