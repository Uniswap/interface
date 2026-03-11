import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, useIsDarkMode } from 'ui/src'
import { ChartBarCrossed } from 'ui/src/components/icons/ChartBarCrossed'
import { ChartTooltip } from '~/components/Charts/ChartTooltip'

const StaleBannerWrapper = styled(ChartTooltip, {
  borderRadius: '$rounded16',
  left: 'unset',
  top: 'unset',
  bottom: '$spacing40',
  p: '$spacing12',
  backgroundColor: '$surface4',
  borderColor: '$surface3',
})

export function StaleBanner() {
  const { t } = useTranslation()
  const isDarkTheme = useIsDarkMode()

  // TODO(WEB-3739): Update Chart UI to grayscale when data is stale
  return (
    <StaleBannerWrapper data-testid="chart-stale-banner" borderWidth={isDarkTheme ? 0 : '$borderWidth1'}>
      <Flex row gap="$gap8">
        <ChartBarCrossed color="$neutral1" size="$icon.16" />
        <Text variant="body3" color="$neutral1">
          {t('common.dataOutdated')}
        </Text>
      </Flex>
    </StaleBannerWrapper>
  )
}
