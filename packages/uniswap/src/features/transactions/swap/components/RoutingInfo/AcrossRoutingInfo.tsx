import { isMobileApp } from '@universe/environment'
import { zIndexes } from '@universe/mycelium'
import AcrossLogoFull from '@universe/mycelium/assets/logos/svg/across-logo-full.svg'
import {
  AcrossApiLabel,
  AcrossPoweredBy,
  AcrossRoutingCaption,
  AcrossRoutingRow,
  BestRouteLabel,
} from '@universe/swap-ui'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { OrderRouting } from 'ui/src/components/icons/OrderRouting'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

/** Shell adapter: owns both info popovers; the row, labels and caption come from swap-ui. */
export function AcrossRoutingInfo(): JSX.Element {
  const { t } = useTranslation()

  const commonModalProps = useMemo(
    () => ({
      caption: t('swap.details.orderRoutingInfo'),
      rejectText: t('common.button.close'),
      modalName: ModalName.AcrossRoutingInfo,
      severity: WarningSeverity.None,
      title: t('common.bestRoute'),
      icon: <OrderRouting color="$neutral2" size="$icon.24" />,
      zIndex: zIndexes.popover,
    }),
    [t],
  )

  const commonTooltipProps = useMemo(() => ({ text: <AcrossRoutingCaption />, placement: 'top' as const }), [])

  const commonInfoButton = useMemo(
    () =>
      isMobileApp ? (
        <AcrossPoweredBy
          learnMoreLink={<LearnMoreLink textVariant="buttonLabel3" url={UniswapHelpUrls.articles.acrossRoutingInfo} />}
          logo={<AcrossLogoFull color="$neutral3" />}
        />
      ) : undefined,
    [],
  )

  return (
    <AcrossRoutingRow
      info={
        <WarningInfo
          infoButton={commonInfoButton}
          modalProps={commonModalProps}
          tooltipProps={commonTooltipProps}
          triggerPlacement="end"
          analyticsTitle="Across order routing"
        >
          <BestRouteLabel wrapped={false} />
        </WarningInfo>
      }
      apiInfo={
        <WarningInfo
          infoButton={commonInfoButton}
          modalProps={commonModalProps}
          tooltipProps={commonTooltipProps}
          trigger={<AcrossApiLabel />}
          analyticsTitle="Across order routing (API)"
        />
      }
    />
  )
}
