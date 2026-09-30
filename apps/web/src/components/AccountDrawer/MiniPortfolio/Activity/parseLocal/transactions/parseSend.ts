import { CurrencyAmount } from '@uniswap/sdk-core'
import { UniverseChainId, Platform, getValidAddress } from '@universe/chains'
import { fetchCurrency } from 'uniswap/src/features/tokens/fetchCurrencyInfo'
import type { SendTokenTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import type { FormatNumberFunctionType } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/types'
import type { Activity } from '~/components/AccountDrawer/MiniPortfolio/Activity/types'

export async function parseSend({
  send,
  formatNumber,
  chainId,
}: {
  send: SendTokenTransactionInfo
  formatNumber: FormatNumberFunctionType
  chainId: UniverseChainId
}): Promise<Partial<Activity>> {
  const { tokenAddress, currencyAmountRaw, recipient } = send
  const currency = await fetchCurrency(buildCurrencyId(chainId, tokenAddress))
  const formattedAmount =
    currency && currencyAmountRaw
      ? formatNumber({
          value: parseFloat(CurrencyAmount.fromRawAmount(currency, currencyAmountRaw).toSignificant()),
          type: NumberType.TokenNonTx,
        })
      : i18n.t('common.unknown')
  // TODO(SWAP-119): edit to allow SVM platform if Solana send is supported
  const otherAccount =
    getValidAddress({ address: recipient, platform: Platform.EVM, withEVMChecksum: true }) || undefined

  return {
    descriptor: i18n.t('activity.transaction.send.descriptor', {
      amountWithSymbol: `${formattedAmount} ${currency?.symbol}`,
      walletAddress: recipient,
    }),
    otherAccount,
    currencies: [currency],
  }
}
