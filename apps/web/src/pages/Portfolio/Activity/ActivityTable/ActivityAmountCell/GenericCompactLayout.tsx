import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Receipt } from 'ui/src/components/icons/Receipt'
import { iconSizes } from 'ui/src/theme'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { shortenHash } from 'utilities/src/addresses'
import { ActivityProtocolInfo } from '~/pages/Portfolio/Activity/ActivityTable/activityTableModels'

interface GenericCompactLayoutProps {
  transaction: TransactionDetails
  protocolInfo: ActivityProtocolInfo | null | undefined
  labelOverride?: string
}

function _GenericCompactLayout({ transaction, protocolInfo, labelOverride }: GenericCompactLayoutProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" gap="$gap8">
      {protocolInfo?.logoUrl ? (
        <img
          src={protocolInfo.logoUrl}
          alt={protocolInfo.name}
          width={iconSizes.icon24}
          height={iconSizes.icon24}
          style={{ borderRadius: '50%' }}
        />
      ) : (
        <Flex
          width={iconSizes.icon24}
          height={iconSizes.icon24}
          borderRadius="$roundedFull"
          backgroundColor="$surface3"
          alignItems="center"
          justifyContent="center"
        >
          <Receipt size="$icon.16" color="$neutral2" />
        </Flex>
      )}
      <Flex>
        <Text variant="body4" color="$neutral2">
          {labelOverride ?? t('transaction.details.transaction')}
        </Text>
        <Text variant="body3" color="$neutral1">
          {protocolInfo?.name ?? shortenHash(transaction.hash)}
        </Text>
      </Flex>
    </Flex>
  )
}

export const GenericCompactLayout = memo(_GenericCompactLayout)
