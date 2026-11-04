import { TradingApi } from '@universe/api'
import { zIndexes } from '@universe/mycelium'
import { OrderRouting } from '@universe/mycelium/icons/OrderRouting'
import {
  BestRouteLabel,
  BridgeProviderLabel,
  BridgeProviderRoutingCaption,
  RoutingInfoRow,
} from '@universe/transactions-ui'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { BridgeProviderLogo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/BridgeProviderLogo'
import { RELAY_DAPP_INFO } from 'uniswap/src/features/transactions/swap/utils/routing'

/** Shell adapter: owns both info popovers; the row, label and caption come from transactions-ui. */
export function RelayRoutingInfo(): JSX.Element {
  const { t } = useTranslation()
  const caption = t('swap.details.orderRoutingInfo.relay')

  const commonModalProps = useMemo(
    () => ({
      caption,
      rejectText: t('common.button.close'),
      modalName: ModalName.RelayRoutingInfo,
      severity: WarningSeverity.None,
      title: t('common.bestRoute'),
      icon: <OrderRouting color="$neutral2" size="$icon.24" />,
      zIndex: zIndexes.popover,
    }),
    [caption, t],
  )

  const commonTooltipProps = useMemo(
    () => ({ text: <BridgeProviderRoutingCaption caption={caption} />, placement: 'top' as const }),
    [caption],
  )

  return (
    <RoutingInfoRow
      info={
        <WarningInfo
          modalProps={commonModalProps}
          tooltipProps={commonTooltipProps}
          triggerPlacement="end"
          analyticsTitle="Relay order routing"
        >
          <BestRouteLabel wrapped={false} />
        </WarningInfo>
      }
      label={
        <WarningInfo
          modalProps={commonModalProps}
          tooltipProps={commonTooltipProps}
          trigger={
            <BridgeProviderLabel
              logo={<BridgeProviderLogo provider={TradingApi.BridgeProvider.RELAY} />}
              name={RELAY_DAPP_INFO.name}
            />
          }
          analyticsTitle="Relay order routing (API)"
        />
      }
    />
  )
}
