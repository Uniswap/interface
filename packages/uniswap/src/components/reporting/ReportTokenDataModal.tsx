import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ChartBarCrossed } from 'ui/src/components/icons/ChartBarCrossed'
import { BaseModalProps } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { ReportModal, ReportOption } from 'uniswap/src/components/reporting/ReportModal'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { submitTokenDataReport, TokenDataReportOption } from 'uniswap/src/features/reporting/reports'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { NATIVE_ANALYTICS_ADDRESS_VALUE } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'

export type ReportTokenDataModalProps = {
  currency?: Currency
  isMarkedSpam?: Maybe<boolean>
  onReportSuccess?: () => void
}

export function ReportTokenDataModal({
  currency,
  isOpen,
  isMarkedSpam,
  onReportSuccess,
  onClose,
}: ReportTokenDataModalProps & BaseModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const submitReport = useEvent(
    ({ checkedItems, reportText }: { checkedItems: Set<TokenDataReportOption>; reportText: string }) => {
      if (!currency) {
        return
      }

      // Submit report to amplitude
      submitTokenDataReport({
        chainId: currency.chainId,
        tokenAddress: currency.isNative ? NATIVE_ANALYTICS_ADDRESS_VALUE : currency.address,
        tokenName: currency.name,
        isMarkedSpam,
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
      {
        title: t('reporting.token.options.other.title'),
        value: TokenDataReportOption.Other,
      },
    ],
    [t],
  )

  return (
    <ReportModal
      modalName={ModalName.ReportTokenData}
      modalTitle={t('reporting.token.data.title.withSymbol', { symbol: currency?.symbol ?? '' })}
      icon={ChartBarCrossed}
      reportOptions={reportOptions}
      textOptionValue={TokenDataReportOption.Other}
      isOpen={isOpen}
      submitReport={submitReport}
      onClose={onClose}
    />
  )
}
