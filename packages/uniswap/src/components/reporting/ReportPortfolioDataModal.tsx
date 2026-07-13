import { isProdEnv } from '@universe/environment'
import { FeatureFlags, useFeatureFlagWithExposureLoggingDisabled } from '@universe/gating'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ChartBarCrossed } from 'ui/src/components/icons/ChartBarCrossed'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { ReportModal, ReportOption } from 'uniswap/src/components/reporting/ReportModal'
import { DataServiceApiClient } from 'uniswap/src/data/apiClients/dataApi/DataApiClient'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { PortfolioDataReportOption, submitPortfolioDataReport } from 'uniswap/src/features/reporting/reports'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

export type ReportPortfolioDataModalProps = {
  onReportSuccess?: () => void
}

export function ReportPortfolioDataModal({
  isOpen,
  onReportSuccess,
  onClose,
}: ReportPortfolioDataModalProps & BaseModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const walletAddress = useActiveAddress(Platform.EVM)
  // Read without logging; the pools exposure is logged only where the feature is actually shown (see usePoolsTabVisibility).
  const portfolioPoolsBalancesEnabled = useFeatureFlagWithExposureLoggingDisabled(FeatureFlags.PortfolioPoolsBalances)

  const submitReport = useEvent(
    ({
      checkedItems,
      reportTexts,
    }: {
      checkedItems: Set<PortfolioDataReportOption>
      reportTexts: Map<PortfolioDataReportOption, string>
    }) => {
      submitPortfolioDataReport({
        walletAddress,
        reportOptions: Array.from(checkedItems),
        reportTexts,
      })

      // Submit data report to Zerion via backend proxy
      if (checkedItems.has(PortfolioDataReportOption.Performance) && isProdEnv() && walletAddress) {
        DataServiceApiClient.submitDataReport({
          reportType: 'wallet',
          tag: 'pnl',
          details: reportTexts.get(PortfolioDataReportOption.Performance),
          walletAddress,
        }).catch((error: unknown) => {
          logger.warn('ReportPortfolioDataModal', 'submitReport', 'Failed to submit data report to backend', {
            error: error instanceof Error ? error.message : String(error),
          })
        })
      }

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

  const reportOptions: ReportOption<PortfolioDataReportOption>[] = useMemo(
    () => [
      ...(portfolioPoolsBalancesEnabled
        ? [
            {
              title: t('common.tokens'),
              subtitle: t('reporting.portfolio.data.options.tokens.subtitle'),
              value: PortfolioDataReportOption.Tokens,
              additionalTextInput: true,
            },
            {
              title: t('common.pools'),
              subtitle: t('reporting.portfolio.data.options.pools.subtitle'),
              value: PortfolioDataReportOption.Pools,
              additionalTextInput: true,
            },
          ]
        : []),
      {
        title: t('reporting.portfolio.data.options.performance.title'),
        subtitle: t('reporting.portfolio.data.options.performance.subtitle'),
        value: PortfolioDataReportOption.Performance,
        additionalTextInput: true,
      },
      {
        title: t('reporting.token.options.other.title'),
        value: PortfolioDataReportOption.Other,
        additionalTextInput: true,
      },
    ],
    [t, portfolioPoolsBalancesEnabled],
  )

  return (
    <ReportModal
      modalName={ModalName.ReportPortfolioData}
      modalTitle={t('reporting.portfolio.data.modal.title')}
      icon={ChartBarCrossed}
      reportOptions={reportOptions}
      isOpen={isOpen}
      submitReport={submitReport}
      onClose={onClose}
    />
  )
}
