import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import AcrossLogoFull from 'ui/src/assets/logos/svg/across-logo-full.svg'
import { OrderRouting } from 'ui/src/components/icons/OrderRouting'
import { AcrossLogo } from 'ui/src/components/logos/AcrossLogo'
import { zIndexes } from 'ui/src/theme'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isMobileApp } from 'utilities/src/platform'

export function AcrossRoutingInfo(): JSX.Element {
  const { t } = useTranslation()

  const commonModalProps = useMemo(
    () => ({
      caption: t('swap.details.orderRoutingInfo'),
      rejectText: t('common.button.close'),
      modalName: ModalName.AcrossRoutingInfo,
      severity: WarningSeverity.None,
      title: t('swap.details.orderRouting'),
      icon: <OrderRouting color="$neutral2" size="$icon.24" />,
      zIndex: zIndexes.popover,
    }),
    [t],
  )

  const commonTooltipProps = useMemo(
    () => ({
      text: (
        <Text variant="body4" color="$neutral2">
          {t('swap.details.orderRoutingInfo')}
        </Text>
      ),
      placement: 'top' as const,
    }),
    [t],
  )

  const commonInfoButton = useMemo(
    () =>
      isMobileApp ? (
        <Flex centered gap="$spacing16">
          <LearnMoreLink textVariant="buttonLabel3" url={uniswapUrls.helpArticleUrls.acrossRoutingInfo} />
          <Flex row alignItems="center" gap="$spacing6" justifyContent="center">
            <Text color="$neutral3" variant="buttonLabel4">
              {t('swap.details.poweredBy')}
            </Text>
            <Flex>
              <AcrossLogoFull color="$neutral3" />
            </Flex>
          </Flex>
        </Flex>
      ) : undefined,
    [t],
  )

  return (
    <Flex row alignItems="center" justifyContent="space-between" width="100%">
      <WarningInfo
        infoButton={commonInfoButton}
        modalProps={commonModalProps}
        tooltipProps={commonTooltipProps}
        triggerPlacement="end"
        analyticsTitle="Across order routing"
      >
        <Text color="$neutral2" variant="body3">
          {t('swap.details.orderRouting')}
        </Text>
      </WarningInfo>

      <WarningInfo
        infoButton={commonInfoButton}
        modalProps={commonModalProps}
        tooltipProps={commonTooltipProps}
        trigger={
          <Flex row shrink justifyContent="flex-end" gap="$spacing6" alignItems="center">
            <AcrossLogo size="$icon.16" />
            <Text color="$neutral1" variant="body3">
              Across API
            </Text>
          </Flex>
        }
        analyticsTitle="Across order routing (API)"
      />
    </Flex>
  )
}
