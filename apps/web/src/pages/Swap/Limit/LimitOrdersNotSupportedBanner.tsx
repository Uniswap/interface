import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'

interface LimitOrdersNotSupportedBannerProps {
  onMoreDetails: () => void
}

export function LimitOrdersNotSupportedBanner({ onMoreDetails }: LimitOrdersNotSupportedBannerProps) {
  const { t } = useTranslation()

  return (
    <Flex row backgroundColor="$surface2" borderRadius="$rounded12" p="$padding12" gap="$spacing12">
      <AlertTriangleFilled color="$neutral1" size="$icon.20" />
      <Flex row $sm={{ flexDirection: 'column' }}>
        <Text variant="body3" color="$neutral1">
          {`${t('smartWallets.delegationMismatchModal.limitOrders.unsupported')} `}
        </Text>
        <TouchableArea onPress={onMoreDetails}>
          <Text variant="body3" color="$accent1">
            {t('common.moreDetails')}
          </Text>
        </TouchableArea>
      </Flex>
    </Flex>
  )
}
