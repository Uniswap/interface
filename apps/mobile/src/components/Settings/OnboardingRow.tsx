import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useSettingsStackNavigation } from 'src/app/navigation/types'
import { clearOnboardingTimestamp } from 'src/features/analytics/onboardingTimestamp'
import { useAppStateResetter } from 'src/features/appState/appStateResetter'
import { Flex, type IconProps, Text, TouchableArea } from 'ui/src'
import { RotatableChevron, UniswapLogo } from 'ui/src/components/icons'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { resetWallet, setFinishedOnboarding } from 'wallet/src/features/wallet/slice'

export function OnboardingRow({ iconProps }: { iconProps: IconProps }): JSX.Element {
  const dispatch = useDispatch()
  const navigation = useSettingsStackNavigation()
  const associatedAccounts = useSignerAccounts()
  const appStateResetter = useAppStateResetter()
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const onPressReset = (): void => {
    setShowConfirmModal(false)
    const uniqueMnemonicIds = new Set(associatedAccounts.map((a) => a.mnemonicId))
    const mnemonicPromises = [...uniqueMnemonicIds].map(Keyring.removeMnemonic)
    const accountAddresses = associatedAccounts.map((a) => a.address)
    const keyPromises = accountAddresses.map(Keyring.removePrivateKey)
    Promise.all([...mnemonicPromises, ...keyPromises])
      .then(() => appStateResetter.resetAll())
      .then(() => {
        navigation.goBack()
        clearOnboardingTimestamp()
        dispatch(resetWallet())
        dispatch(setFinishedOnboarding({ finishedOnboarding: false }))
      })
      .catch((error) => {
        logger.error(error, {
          tags: { file: 'OnboardingRow.tsx', function: 'onPressReset' },
        })
      })
  }

  return (
    <>
      <WarningModal
        caption="This will delete the stored mnemonics, clear redux state, and return to the onboarding flow."
        acknowledgeText="Reset"
        rejectText="Cancel"
        isOpen={showConfirmModal}
        modalName={ModalName.DevResetOnboardingWarning}
        severity={WarningSeverity.High}
        title="Reset wallet?"
        onClose={() => setShowConfirmModal(false)}
        onReject={() => setShowConfirmModal(false)}
        onAcknowledge={onPressReset}
      />
      <TouchableArea onPress={() => setShowConfirmModal(true)}>
        <Flex row alignItems="center" justifyContent="space-between" py="$spacing4">
          <Flex row alignItems="center">
            <Flex centered height={32} width={32}>
              <UniswapLogo {...iconProps} />
            </Flex>
            <Text ml="$spacing12" variant="body1">
              Reset wallet (onboarding)
            </Text>
          </Flex>
          <RotatableChevron color="$neutral3" direction="end" size="$icon.24" />
        </Flex>
      </TouchableArea>
    </>
  )
}
