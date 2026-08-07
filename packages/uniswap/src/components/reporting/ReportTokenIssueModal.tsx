import { Currency } from '@uniswap/sdk-core'
import { TokenReportEventType } from '@universe/api'
import { isProdEnv } from '@universe/environment'
import { atom } from 'jotai'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flag } from 'ui/src/components/icons/Flag'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { ReportModal, ReportOption } from 'uniswap/src/components/reporting/ReportModal'
import { dataApiServiceClientV1 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClient'
import { ASSET_TO_REPORT_STRING, ReportAssetType } from 'uniswap/src/data/apiClients/dataApiService/reporting/utils'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { submitTokenIssueReport, TokenReportOption } from 'uniswap/src/features/reporting/reports'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { setTokenVisibility } from 'uniswap/src/features/visibility/slice'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { currencyId, NATIVE_ANALYTICS_ADDRESS_VALUE } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

export type ReportTokenModalProps = {
  currency?: Currency
  source?: 'portfolio' | 'token-details'
  isMarkedSpam?: Maybe<boolean>
  isMultichainAsset?: boolean
  shouldReportMultichainAsset?: boolean
  onReportSuccess?: () => void
}

export const ReportTokenIssueModalPropsAtom = atom<
  | Pick<
      ReportTokenModalProps,
      'source' | 'currency' | 'isMarkedSpam' | 'isMultichainAsset' | 'shouldReportMultichainAsset'
    >
  | undefined
>(undefined)

export function ReportTokenIssueModal({
  currency,
  isOpen,
  source = 'token-details',
  isMarkedSpam,
  isMultichainAsset = false,
  shouldReportMultichainAsset = false,
  onReportSuccess,
  onClose,
}: ReportTokenModalProps & BaseModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const submitReport = useEvent(
    async ({
      checkedItems,
      reportTexts,
    }: {
      checkedItems: Set<TokenReportOption>
      reportTexts: Map<TokenReportOption, string>
    }) => {
      if (!currency) {
        return
      }

      const normalizedCurrencyId = normalizeCurrencyIdForMapLookup(currencyId(currency))

      // Update the visibility of the token in the portfolio
      dispatch(setTokenVisibility({ currencyId: normalizedCurrencyId, isVisible: false }))

      sendAnalyticsEvent(WalletEventName.TokenVisibilityChanged, {
        currencyId: normalizedCurrencyId,
        visible: false,
        is_multichain_asset: isMultichainAsset,
      })

      // Submit report to amplitude
      submitTokenIssueReport({
        source,
        chainId: currency.chainId,
        tokenAddress: currency.isNative ? NATIVE_ANALYTICS_ADDRESS_VALUE : currency.address,
        tokenName: currency.name,
        isMarkedSpam,
        isMultichainAsset,
        reportOptions: Array.from(checkedItems),
        reportTexts,
      })

      if (!currency.isNative && isProdEnv()) {
        // Submit report directly to the data API, ignoring native tokens
        dataApiServiceClientV1
          .submitReport({
            chainId: currency.chainId,
            address: currency.address,
            event: TokenReportEventType.FALSE_NEGATIVE,
            details: ASSET_TO_REPORT_STRING[ReportAssetType.Token],
            ...(shouldReportMultichainAsset && { multichain: true }),
          })
          .catch((error: unknown) => {
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
        title: t('reporting.token.options.cantSellOrTransfer.title'),
        subtitle: t('reporting.token.options.cantSellOrTransfer.subtitle'),
        value: TokenReportOption.CantSellOrTransfer,
      },
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
        title: t('reporting.token.options.otherIssue.title'),
        subtitle: t('reporting.token.options.otherIssue.subtitle'),
        value: TokenReportOption.Other,
        additionalTextInput: true,
      },
    ],
    [t],
  )

  return (
    <ReportModal
      modalName={ModalName.ReportTokenIssue}
      modalTitle={t('reporting.token.report.title.withSymbol', { symbol: currency?.symbol ?? '' })}
      modalSubtitle={t('reporting.token.report.subtitle')}
      icon={Flag}
      reportOptions={reportOptions}
      isOpen={isOpen}
      submitButtonText={t('reporting.token.report.button.submit')}
      submitReport={submitReport}
      onClose={onClose}
    />
  )
}
