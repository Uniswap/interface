import { UniverseChainId } from '@universe/chains'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import type { WrapTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getActivityTitle } from '~/components/Activity/constants'
import type { FormatNumberFunctionType } from '~/components/Activity/parseLocal/types'
import { buildCurrencyDescriptor } from '~/components/Activity/parseLocal/utils'
import type { Activity } from '~/components/Activity/types'

export function parseWrap({
  wrap,
  chainId,
  status,
  formatNumber,
}: {
  wrap: WrapTransactionInfo
  chainId: UniverseChainId
  status: TransactionStatus
  formatNumber: FormatNumberFunctionType
}): Partial<Activity> {
  const native = nativeOnChain(chainId)
  const wrapped = native.wrapped
  const [input, output] = wrap.unwrapped ? [wrapped, native] : [native, wrapped]

  const descriptor = buildCurrencyDescriptor({
    currencyA: input,
    amtA: wrap.currencyAmountRaw,
    currencyB: output,
    amtB: wrap.currencyAmountRaw,
    formatNumber,
    isSwap: true,
  })
  const title = getActivityTitle({
    type: TransactionType.Wrap,
    status,
    alternate: wrap.unwrapped,
  })
  const currencies = wrap.unwrapped ? [wrapped, native] : [native, wrapped]

  return { title, descriptor, currencies }
}
