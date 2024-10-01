import { useTranslation } from 'react-i18next'
import { Flex, Text, UniversalImage } from 'ui/src'
import { ACROSS_LOGO } from 'ui/src/assets'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { iconSizes } from 'ui/src/theme'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isMobileApp } from 'utilities/src/platform'

export function AcrossRoutingInfo(): JSX.Element {
  const { t } = useTranslation()

  return (
    <WarningInfo
      children={
        <Flex row alignItems="center" justifyContent="space-between" width="100%">
          <Flex row alignItems="center" gap="$spacing4">
            <Text color="$neutral2" variant="body3">
              {t('swap.details.orderRouting')}
            </Text>
            <InfoCircle color="$neutral3" size="$icon.16" />
          </Flex>
          <Flex row shrink justifyContent="flex-end" gap="$spacing6" alignItems="center">
            <UniversalImage
              allowLocalUri
              size={{
                width: iconSizes.icon16,
                height: iconSizes.icon16,
              }}
              uri={ACROSS_LOGO}
            />
            <Text color="$neutral1" variant="body3">
              Across API
            </Text>
          </Flex>
        </Flex>
      }
      infoButton={
        isMobileApp ? (
          <LearnMoreLink
            textVariant="buttonLabel3"
            url={uniswapUrls.helpArticleUrls.feeOnTransferHelp} // TODO (WALL-4867): Add Across help article URL
          />
        ) : undefined
      }
      modalProps={{
        caption: t('swap.details.orderRoutingInfo'),
        rejectText: t('common.button.close'),
        modalName: ModalName.AcrossRoutingInfo,
        severity: WarningSeverity.None,
        title: t('swap.details.orderRouting'),
        icon: (
          <UniversalImage
            allowLocalUri
            size={{
              width: iconSizes.icon20,
              height: iconSizes.icon20,
            }}
            uri={ACROSS_LOGO}
          />
        ),
      }}
      tooltipProps={{
        text: (
          <Text variant="body4" color="$neutral2">
            {t('swap.details.orderRoutingInfo')}
          </Text>
        ),
        placement: 'top',
      }}
      trigger={null}
    />
  )
}
