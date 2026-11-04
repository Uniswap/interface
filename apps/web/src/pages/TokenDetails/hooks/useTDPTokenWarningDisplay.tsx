import { Currency } from '@uniswap/sdk-core'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TokenWarningCard } from 'uniswap/src/features/tokens/warnings/TokenWarningCard'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { useIsTokenGeoRestricted } from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode'
import { useEvent } from 'utilities/src/react/hooks'
import { POPUP_MEDIUM_DISMISS_MS } from '~/utils/popups/constants'
import { popupRegistry } from '~/utils/popups/registry'
import { PopupType } from '~/utils/popups/types'

export function useTDPTokenWarningDisplay({
  currency,
  currencyInfo,
}: {
  currency: Currency
  currencyInfo: Maybe<CurrencyInfo>
}) {
  const { t } = useTranslation()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const closeWarningModal = useCallback(() => setShowWarningModal(false), [])

  // Geo-restriction has its own card + CTA; suppress the generic blocked-token card here.
  const isGeoRestricted = useIsTokenGeoRestricted(currency)

  const onTokenWarningReportSuccess = useEvent(() => {
    popupRegistry.addPopup(
      { type: PopupType.Success, message: t('common.reported') },
      'report-token-warning-success',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })

  const warningCard = !isGeoRestricted && (
    <TokenWarningCard currencyInfo={currencyInfo} onPress={() => setShowWarningModal(true)} />
  )

  const warningModal = currencyInfo && (
    <TokenWarningModal
      currencyInfo0={currencyInfo}
      isInfoOnlyWarning
      isVisible={showWarningModal}
      closeModalOnly={closeWarningModal}
      onReportSuccess={onTokenWarningReportSuccess}
      onAcknowledge={closeWarningModal}
    />
  )

  return { warningCard, warningModal }
}
