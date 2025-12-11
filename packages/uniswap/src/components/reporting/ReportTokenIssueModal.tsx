import { Currency } from '@uniswap/sdk-core'
import { ReportAssetType, TokenReportEventType } from '@universe/api'
import { atom } from 'jotai'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flag } from 'ui/src/components/icons/Flag'
import { BaseModalProps } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { ReportModal, ReportOption } from 'uniswap/src/components/reporting/ReportModal'
import { DataServiceApiClient } from 'uniswap/src/data/apiClients/dataApi/DataApiClient'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { submitTokenIssueReport, TokenReportOption } from 'uniswap/src/features/reporting/reports'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { setTokenVisibility } from 'uniswap/src/features/visibility/slice'
import { currencyId, NATIVE_ANALYTICS_ADDRESS_VALUE } from 'uniswap/src/utils/currencyId'
import { isProdEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

export type ReportTokenModalProps = {
  currency?: Currency
  source?: 'portfolio' | 'token-details'
  isMarkedSpam?: Maybe<boolean>
  onReportSuccess?: () => void
}

export const ReportTokenIssueModalPropsAtom = atom<
  Pick<ReportTokenModalProps, 'source' | 'currency' | 'isMarkedSpam'> | undefined
>(undefined)

export function ReportTokenIssueModal({
  currency,
  isOpen,
  source = 'token-details',
  isMarkedSpam,
  onReportSuccess,
  onClose,
}: ReportTokenModalProps & BaseModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const submitReport = useEvent(
    async ({ checkedItems, reportText }: { checkedItems: Set<TokenReportOption>; reportText: string }) => {
      if (!currency) {
        return
      }

      // Update the visibility of the token in the portfolio
      dispatch(
        setTokenVisibility({ currencyId: normalizeCurrencyIdForMapLookup(currencyId(currency)), isVisible: false }),
      )

      // Submit report to amplitude
      submitTokenIssueReport({
        source,
        chainId: currency.chainId,
        tokenAddress: currency.isNative ? NATIVE_ANALYTICS_ADDRESS_VALUE : currency.address,
        tokenName: currency.name,
        isMarkedSpam,
        reportOptions: Array.from(checkedItems),
        reportText,
      })

      if (!currency.isNative && isProdEnv()) {
        // Submit report directly to the data API, ignoring native tokens
        DataServiceApiClient.submitTokenReport({
          chainId: currency.chainId,
          address: currency.address,
          event: TokenReportEventType.FalseNegative,
          assetType: ReportAssetType.Token,
        }).catch((error: unknown) => {
          // Still show success since analytics and local hiding succeeded, but log the issue for monitoring
          logger.warn('ReportTokenIssueModal', 'submitReport', 'Failed to submit token report to backend', {
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

  const reportOptions: ReportOption<TokenReportOption>[] = useMemo(
    () => [
      {
        title: t('reporting.token.options.spam.title'),
        subtitle: t('reporting.token.options.spam.subtitle'),
        value: TokenReportOption.Spam,
      },
      {
        title: t('reporting.token.options.imposter.title'),
        subtitle: t('reporting.token.options.imposter.subtitle'),
        value: TokenReportOption.Imposter,
      },
      {
        title: t('reporting.token.options.hiddenFees.title'),
        subtitle: t('reporting.token.options.hiddenFees.subtitle'),
        value: TokenReportOption.HiddenFees,
      },
      {
        title: t('reporting.token.options.other.title'),
        value: TokenReportOption.Other,
      },
    ],
    [t],
  )

  return (
    <ReportModal
      modalName={ModalName.ReportTokenIssue}
      modalTitle={t('reporting.token.report.title.withSymbol', { symbol: currency?.symbol ?? '' })}
      icon={Flag}
      reportOptions={reportOptions}
      textOptionValue={TokenReportOption.Other}
      isOpen={isOpen}
      submitReport={submitReport}
      onClose={onClose}
    />
  )
}
