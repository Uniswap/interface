import { useTranslation } from 'react-i18next'
import { InlineCard, Text, TouchableArea } from 'ui/src'
import { ArrowUpRight, MessageQuestion } from 'ui/src/components/icons'
import { openOfframpPendingSupportLink } from 'wallet/src/utils/linking'

export function OffRampPendingSupportCard(): JSX.Element {
  const { t } = useTranslation()

  return (
    <TouchableArea p="$spacing8" onPress={openOfframpPendingSupportLink}>
      <InlineCard
        CtaButtonIcon={ArrowUpRight}
        CtaButtonIconColor="$neutral2"
        Icon={MessageQuestion}
        color="$neutral2"
        iconColor="$neutral2"
        description={
          <Text color="$neutral2" variant="body3">
            {t('transaction.status.sale.pendingCard.msg')}
          </Text>
        }
        heading={
          <Text color="$neutral1" variant="body3">
            {t('transaction.status.sale.pendingCard.title')}
          </Text>
        }
      />
    </TouchableArea>
  )
}
