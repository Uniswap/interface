import { ReactNode, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, LabeledCheckbox, Text, TouchableArea } from 'ui/src'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { useDismissedCompatibleAddressWarnings } from 'uniswap/src/features/tokens/warnings/slice/hooks'
import { openUri } from 'uniswap/src/utils/linking'

interface CompatibleAddressModalProps {
  isOpen: boolean
  onClose: () => void
  onAcknowledge: () => void
  currencyInfo: CurrencyInfo
  closeHeaderComponent?: ReactNode
}

export function CompatibleAddressModal({
  isOpen,
  onClose,
  onAcknowledge,
  currencyInfo,
  closeHeaderComponent,
}: CompatibleAddressModalProps): JSX.Element {
  const { t } = useTranslation()
  const chainName = getChainLabel(currencyInfo.currency.chainId)
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false)
  const { onDismissTokenWarning } = useDismissedCompatibleAddressWarnings(currencyInfo.currency)

  const handleOnAcknowledge = useCallback(() => {
    if (dontShowAgain) {
      onDismissTokenWarning()
    }

    onAcknowledge()
  }, [onAcknowledge, dontShowAgain, onDismissTokenWarning])

  return (
    <Trace logImpression modal={ModalName.CompatibleAddressWarning}>
      <WarningModal
        captionComponent={
          <Flex gap="$spacing24" alignItems="center">
            <Text color="$neutral2" textAlign="center" variant="body3">
              {t('bridgedAsset.send.warning.description', {
                chainName,
                currencySymbol: currencyInfo.currency.symbol ?? currencyInfo.currency.wrapped.address,
              })}{' '}
              <Trace logPress element={ElementName.GetHelp}>
                <TouchableArea
                  display="inline"
                  onPress={() => openUri({ uri: uniswapUrls.helpArticleUrls.bridgedAssets })}
                >
                  <Text variant="buttonLabel4" color="$neutral1" mt="$spacing4">
                    {t('common.button.learn')}
                  </Text>
                </TouchableArea>
              </Trace>
            </Text>

            <LabeledCheckbox
              checked={dontShowAgain}
              checkedColor="$neutral1"
              text={
                <Text color="$neutral2" variant="buttonLabel3">
                  {t('token.safety.warning.dontShowWarningAgainShort')}
                </Text>
              }
              size="$icon.16"
              gap="$spacing8"
              onCheckPressed={() => setDontShowAgain((s: boolean) => !s)}
            />
          </Flex>
        }
        closeHeaderComponent={closeHeaderComponent}
        acknowledgeText={t('common.button.continue')}
        isOpen={isOpen}
        modalName={ModalName.CompatibleAddressWarning}
        severity={WarningSeverity.Medium}
        title={t('bridgedAsset.send.warning.title')}
        acknowledgeButtonEmphasis="secondary"
        pt="$none"
        onAcknowledge={handleOnAcknowledge}
        onClose={onClose}
      />
    </Trace>
  )
}
