import { Currency } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { atom } from 'jotai'
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
import { submitTokenDataReport, TokenDataReportOption } from 'uniswap/src/features/reporting/reports'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { NATIVE_ANALYTICS_ADDRESS_VALUE } from 'uniswap/src/utils/currencyId'
import { isProdEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

export type ReportTokenDataModalProps = {
  currency?: Currency
  isMarkedSpam?: Maybe<boolean>
  onReportSuccess?: () => void
}

export const ReportTokenDataModalPropsAtom = atom<
  Pick<ReportTokenDataModalProps, 'currency' | 'isMarkedSpam'> | undefined
>(undefined)

export function ReportTokenDataModal({
  currency,
  isOpen,
  isMarkedSpam,
  onReportSuccess,
  onClose,
}: ReportTokenDataModalProps & BaseModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const isPnLEnabled = useFeatureFlag(FeatureFlags.ProfitLoss)
  const walletAddress = useActiveAddress(Platform.EVM)

  const submitReport = useEvent(
    ({
      checkedItems,
      reportTexts,
    }: {
      checkedItems: Set<TokenDataReportOption>
      reportTexts: Map<TokenDataReportOption, string>
    }) => {
      if (!currency) {
        return
      }

      // Submit report to amplitude
      submitTokenDataReport({
        chainId: currency.chainId,
        tokenAddress: currency.isNative ? NATIVE_ANALYTICS_ADDRESS_VALUE : currency.address,
        tokenName: currency.name,
        isMarkedSpam,
        walletAddress,
        reportOptions: Array.from(checkedItems),
        reportTexts,
      })

      // Submit data report to Zerion via backend proxy
      if (checkedItems.has(TokenDataReportOption.Performance) && isProdEnv() && walletAddress && !currency.isNative) {
        DataServiceApiClient.submitDataReport({
          reportType: 'token',
          tag: 'pnl',
          details: reportTexts.get(TokenDataReportOption.Performance),
          walletAddress,
          chainId: currency.chainId,
          tokenAddress: currency.address,
        }).catch((error: unknown) => {
          logger.warn('ReportTokenDataModal', 'submitReport', 'Failed to submit data report to backend', {
            error: error instanceof Error ? error.message : String(error),
            chainId: currency.chainId,
            address: currency.address,
          })
        })
      }

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

  const reportOptions: ReportOption<TokenDataReportOption>[] = useMemo(
    () => [
      {
        title: t('reporting.token.data.options.price.title'),
        subtitle: t('reporting.token.data.options.price.subtitle'),
        value: TokenDataReportOption.Price,
      },
      {
        title: t('reporting.token.data.options.volume.title'),
        subtitle: t('reporting.token.data.options.volume.subtitle'),
        value: TokenDataReportOption.Volume,
      },
      {
        title: t('reporting.token.data.options.priceChart.title'),
        subtitle: t('reporting.token.data.options.priceChart.subtitle'),
        value: TokenDataReportOption.PriceChart,
      },
      {
        title: t('reporting.token.data.options.tokenDetails.title'),
        subtitle: t('reporting.token.data.options.tokenDetails.subtitle'),
        value: TokenDataReportOption.TokenDetails,
      },
      ...(isPnLEnabled
        ? [
            {
              title: t('reporting.token.data.options.performance.title'),
              subtitle: t('reporting.token.data.options.performance.subtitle'),
              value: TokenDataReportOption.Performance,
              additionalTextInput: true,
            },
          ]
        : []),
      {
        title: t('reporting.token.options.other.title'),
        value: TokenDataReportOption.Other,
        additionalTextInput: true,
      },
    ],
    [t, isPnLEnabled],
  )

  return (
    <ReportModal
      modalName={ModalName.ReportTokenData}
      modalTitle={t('reporting.token.data.title.withSymbol', { symbol: currency?.symbol ?? '' })}
      icon={ChartBarCrossed}
      reportOptions={reportOptions}
      isOpen={isOpen}
      submitReport={submitReport}
      onClose={onClose}
    />
  )
}
