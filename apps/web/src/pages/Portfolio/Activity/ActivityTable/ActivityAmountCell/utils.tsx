import { iconSizes } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildActivityRowFragments } from '~/pages/Portfolio/Activity/ActivityTable/registry'
import { getTransactionTypeFilterOptions } from '~/pages/Portfolio/Activity/Filters/utils'

export const COMPACT_THUMBNAIL_SIZE = iconSizes.icon32
export const AMOUNT_COLUMN_WIDTH = 180

export function getTransactionTypeLabel({
  transaction,
  t,
}: {
  transaction: TransactionDetails
  t: ReturnType<typeof useTranslation>['t']
}): string {
  const fragments = buildActivityRowFragments(transaction)
  const { typeLabel } = fragments

  const transactionTypeOptions = getTransactionTypeFilterOptions(t)
  const typeOption = typeLabel?.baseGroup ? transactionTypeOptions[typeLabel.baseGroup] : null

  return typeLabel?.overrideLabelKey ? t(typeLabel.overrideLabelKey) : (typeOption?.label ?? 'Transaction')
}

export function createTokenLogo(currencyInfo: CurrencyInfo | null | undefined): React.ReactNode {
  if (!currencyInfo) {
    return null
  }

  return (
    <TokenLogo
      chainId={currencyInfo.currency.chainId}
      name={currencyInfo.currency.name}
      symbol={currencyInfo.currency.symbol}
      size={COMPACT_THUMBNAIL_SIZE}
      url={currencyInfo.logoUrl}
    />
  )
}
