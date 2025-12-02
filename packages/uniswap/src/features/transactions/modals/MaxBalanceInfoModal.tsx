import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isWebPlatform } from 'utilities/src/platform'

interface MaxBalanceInfoModalProps {
  isMax: boolean
  isModalOpen: boolean
  isTooltipEnabled: boolean
  currencySymbol?: string
  onClose: () => void
}

// similar to `WarningInfo` but it's a controlled modal
export function MaxBalanceInfoModal({
  isMax,
  children,
  isModalOpen,
  isTooltipEnabled,
  currencySymbol,
  onClose,
}: PropsWithChildren<MaxBalanceInfoModalProps>): JSX.Element {
  const { t } = useTranslation()

  if (isWebPlatform) {
    if (!isTooltipEnabled) {
      return <>{children}</>
    }

    return (
      <InfoTooltip
        text={
          <Text variant="body4" textAlign="left" color="$neutral2">
            {isMax
              ? t('transaction.networkCost.maxNativeBalance.description')
              : t('swap.warning.insufficientGas.button', {
                  currencySymbol: currencySymbol || '',
                })}
          </Text>
        }
        placement="top"
        trigger={children}
      />
    )
  }

  return (
    <>
      {children}
      <WarningModal
        caption={t('transaction.networkCost.maxNativeBalance.description')}
        isOpen={isModalOpen}
        modalName={ModalName.NativeBalanceInfo}
        severity={WarningSeverity.Low}
        title={t('transaction.networkCost.maxNativeBalance.title')}
        rejectText={t('common.button.close')}
        onClose={onClose}
        onReject={onClose}
      />
    </>
  )
}
