import { buildActivityRowFragments } from 'components/ActivityTable/registry'
import { TableText } from 'components/Table/styled'
import { getTransactionTypeFilterOptions } from 'pages/Portfolio/Activity/Filters/utils'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

interface TransactionTypeCellProps {
  transaction: TransactionDetails
}

export function TransactionTypeCell({ transaction }: TransactionTypeCellProps) {
  const { t } = useTranslation()
  const { typeLabel } = buildActivityRowFragments(transaction)

  // Get the icon from the filter options based on base group
  const transactionTypeOptions = getTransactionTypeFilterOptions(t)
  const typeOption = typeLabel?.baseGroup ? transactionTypeOptions[typeLabel.baseGroup] : null
  const IconComponent = typeOption?.icon

  // Use override label key if provided, otherwise use the base group label
  const label = typeLabel?.overrideLabelKey ? t(typeLabel.overrideLabelKey) : (typeOption?.label ?? 'Transaction')

  return (
    <Flex row alignItems="center" gap="$gap8">
      {IconComponent && <IconComponent size="$icon.16" color="$neutral1" />}
      <TableText variant="body3">{label}</TableText>
    </Flex>
  )
}
