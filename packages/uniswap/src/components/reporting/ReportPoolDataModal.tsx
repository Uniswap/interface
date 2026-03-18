import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ChartBarCrossed } from 'ui/src/components/icons/ChartBarCrossed'
import { BaseModalProps } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { ReportModal, ReportOption } from 'uniswap/src/components/reporting/ReportModal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { PoolDataReportOption, submitPoolDataReport } from 'uniswap/src/features/reporting/reports'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

export type ReportPoolDataModalProps = {
  onReportSuccess?: () => void
  poolInfo: {
    poolId: string
    chainId: UniverseChainId
    version: ProtocolVersion
    token0: Currency
    token1: Currency
  }
}

export function ReportPoolDataModal({
  poolInfo,
  isOpen,
  onReportSuccess,
  onClose,
}: ReportPoolDataModalProps & BaseModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const submitReport = useEvent(
    ({ checkedItems, reportText }: { checkedItems: Set<PoolDataReportOption>; reportText: string }) => {
      // Submit report to amplitude
      submitPoolDataReport({
        poolId: poolInfo.poolId,
        chainId: poolInfo.chainId,
        version: poolInfo.version,
        token0: poolInfo.token0,
        token1: poolInfo.token1,
        reportOptions: Array.from(checkedItems),
        reportText,
      })

      // Close the modal and register success
      onReportSuccess?.()
      dispatch(
        pushNotification({
          type: AppNotificationType.Success,
          title: t('common.reported'),
        }),
      )
      onClose()
    },
  )

  const reportOptions: ReportOption<PoolDataReportOption>[] = useMemo(
    () => [
      {
        title: t('reporting.token.data.options.price.title'),
        subtitle: t('reporting.pool.data.options.price.subtitle'),
        value: PoolDataReportOption.Price,
      },
      {
        title: t('reporting.token.data.options.volume.title'),
        subtitle: t('reporting.pool.data.options.volume.subtitle'),
        value: PoolDataReportOption.Volume,
      },
      {
        title: t('common.liquidity'),
        subtitle: t('reporting.pool.data.options.liquidity.subtitle'),
        value: PoolDataReportOption.Liquidity,
      },
      {
        title: t('reporting.pool.data.options.priceChart.title'),
        subtitle: t('reporting.pool.data.options.priceChart.subtitle'),
        value: PoolDataReportOption.PriceChart,
      },
      {
        title: t('reporting.token.options.other.title'),
        value: PoolDataReportOption.Other,
      },
    ],
    [t],
  )

  return (
    <ReportModal
      modalName={ModalName.ReportPoolData}
      modalTitle={t('reporting.token.data.title.withSymbol', {
        symbol: `${poolInfo.token0.symbol ?? ''} / ${poolInfo.token1.symbol ?? ''}`,
      })}
      icon={ChartBarCrossed}
      reportOptions={reportOptions}
      textOptionValue={PoolDataReportOption.Other}
      isOpen={isOpen}
      submitReport={submitReport}
      onClose={onClose}
    />
  )
}
