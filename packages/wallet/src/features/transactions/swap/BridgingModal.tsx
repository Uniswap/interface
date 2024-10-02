import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Checkbox, Flex, Text, TouchableArea } from 'ui/src'
import { Shuffle } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { setHasDismissedBridgingWarning } from 'wallet/src/features/behaviorHistory/slice'

export function BridgingModal({
  isOpen,
  onContinue,
  onClose,
  fromNetwork,
  toNetwork,
}: {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  fromNetwork: UniverseChainId
  toNetwork: UniverseChainId
}): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [doNotShowAgainPressed, setDoNotShowAgainPressed] = useState(false)
  const onPressDoNotShowAgain = useCallback(() => {
    const toggled = !doNotShowAgainPressed
    dispatch(setHasDismissedBridgingWarning(toggled))
    setDoNotShowAgainPressed(toggled)
  }, [doNotShowAgainPressed, dispatch])

  const icon = (
    <Flex row gap="$gap8">
      <NetworkLogo chainId={fromNetwork} shape="square" size={iconSizes.icon20} />
      <Shuffle color="$neutral2" size="$icon.20" />
      <NetworkLogo chainId={toNetwork} shape="square" size={iconSizes.icon20} />
    </Flex>
  )

  return (
    <WarningModal
      backgroundIconColor={false}
      caption={t('swap.bridging.warning.description', {
        fromNetwork: UNIVERSE_CHAIN_INFO[fromNetwork].label,
        toNetwork: UNIVERSE_CHAIN_INFO[toNetwork].label,
      })}
      rejectText={t('common.button.back')}
      acknowledgeText={t('common.button.continue')}
      acknowledgeButtonTheme="primary"
      icon={icon}
      isOpen={isOpen}
      modalName={ModalName.BridgingWarning}
      severity={WarningSeverity.None}
      title={t('swap.bridging.title')}
      onClose={onClose}
      onAcknowledge={onContinue}
    >
      <TouchableArea onPress={onPressDoNotShowAgain}>
        <Flex row alignItems="center" gap="$spacing4">
          <Checkbox size="$icon.20" borderColor="$neutral2" checked={doNotShowAgainPressed} />
          <Text variant="body3" color="$neutral2" py="$spacing8">
            {t('common.dontShowAgain')}
          </Text>
        </Flex>
      </TouchableArea>
    </WarningModal>
  )
}
