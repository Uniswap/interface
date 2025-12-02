import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'

interface LimitedSupportBannerProps {
  onPress: () => void
}

export function LimitedSupportBanner({ onPress }: LimitedSupportBannerProps) {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <TouchableArea
      flexDirection="row"
      backgroundColor="$surface2"
      hoverStyle={{ backgroundColor: '$surface2Hovered' }}
      borderRadius="$rounded12"
      p="$padding12"
      gap="$spacing12"
      justifyContent="space-between"
      alignItems="center"
      onPress={onPress}
      mb="$spacing12"
    >
      <Flex row alignItems="center" gap="$spacing8">
        <AlertTriangleFilled size="$icon.16" fill={colors.neutral1.val} />
        <Text variant="body3" color="$neutral1">
          {t('smartWallets.delegation.limitedSupport')}
        </Text>
      </Flex>
      <InfoCircleFilled size="$icon.16" color="$neutral3" />
    </TouchableArea>
  )
}
