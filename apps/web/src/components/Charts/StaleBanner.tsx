import { ChartTooltip } from 'components/Charts/ChartTooltip'
import { MissingDataBars } from 'components/Table/icons'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, useIsDarkMode, useSporeColors } from 'ui/src'

const StaleBannerWrapper = styled(ChartTooltip, {
  borderRadius: '$rounded16',
  left: 'unset',
  top: 'unset',
  right: '$spacing12',
  bottom: '$spacing40',
  p: '$spacing12',
  backgroundColor: '$surface4',
  borderColor: '$surface3',
})

export function StaleBanner() {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const isDarkTheme = useIsDarkMode()

  // TODO(WEB-3739): Update Chart UI to grayscale when data is stale
  return (
    <StaleBannerWrapper data-testid="chart-stale-banner" borderWidth={isDarkTheme ? 0 : '$borderWidth1'}>
      <Flex row gap="$gap8">
        <MissingDataBars color={colors.neutral1.val} />
        <Text variant="body3" color="$neutral1">
          {t('common.dataOutdated')}
        </Text>
      </Flex>
    </StaleBannerWrapper>
  )
}
