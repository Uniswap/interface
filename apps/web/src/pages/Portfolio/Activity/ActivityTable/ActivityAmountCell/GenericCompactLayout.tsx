import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { shortenHash } from 'utilities/src/addresses'
import { CompactLayout } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/CompactLayout'
import { COMPACT_THUMBNAIL_SIZE } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/utils'
import { ActivityProtocolInfo } from '~/pages/Portfolio/Activity/ActivityTable/activityTableModels'

interface GenericCompactLayoutProps {
  transaction: TransactionDetails
  protocolInfo: ActivityProtocolInfo | null | undefined
  labelOverride?: string
}

function GenericCompactLayoutInner({
  transaction,
  protocolInfo,
  labelOverride,
}: GenericCompactLayoutProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <CompactLayout
      typeLabel={labelOverride ?? t('transaction.details.transaction')}
      logo={
        protocolInfo?.logoUrl ? (
          <img
            src={protocolInfo.logoUrl}
            alt={protocolInfo.name}
            width={COMPACT_THUMBNAIL_SIZE}
            height={COMPACT_THUMBNAIL_SIZE}
            style={{ borderRadius: '50%' }}
          />
        ) : null
      }
      amountText={protocolInfo?.name ?? shortenHash(transaction.hash)}
    />
  )
}

export const GenericCompactLayout = memo(GenericCompactLayoutInner)
