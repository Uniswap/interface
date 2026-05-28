import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'

interface LimitOrdersNotSupportedBannerProps {
  onMoreDetails: () => void
}

function LimitOrdersNotSupportedBanner({ onMoreDetails }: LimitOrdersNotSupportedBannerProps) {
  const { t } = useTranslation()

  return (
    <Flex row backgroundColor="$surface2" borderRadius="$rounded12" p="$padding12" gap="$spacing12">
      <AlertTriangleFilled width={20} height={20} color="$neutral1" />
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

export default LimitOrdersNotSupportedBanner
