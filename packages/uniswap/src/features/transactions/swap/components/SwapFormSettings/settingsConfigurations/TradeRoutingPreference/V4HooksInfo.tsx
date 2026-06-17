import { isWebPlatform } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { zIndexes } from 'ui/src/theme'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function V4HooksInfo(): JSX.Element {
  const { t } = useTranslation()
  return (
    <WarningInfo
      infoButton={
        <LearnMoreLink textVariant={isWebPlatform ? 'body4' : undefined} url={UniswapHelpUrls.articles.v4HooksInfo} />
      }
      modalProps={{
        caption: t('swap.settings.routingPreference.option.v4.hooks.tooltip'),
        rejectText: t('common.button.close'),
        severity: WarningSeverity.None,
        modalName: ModalName.V4HooksInfo,
        icon: <UniswapLogo size="$icon.24" />,
        zIndex: zIndexes.popover,
      }}
      trigger={
        <Flex row centered>
          <Text color="$neutral1" variant="subheading2" mr="$spacing4">
            {t('swap.settings.routingPreference.option.v4.hooks.title')}
          </Text>
          <InfoCircleFilled color="$neutral3" size="$icon.16" />
        </Flex>
      }
      tooltipProps={{
        text: t('swap.settings.routingPreference.option.v4.hooks.tooltip'),
        placement: 'bottom',
      }}
    />
  )
}
