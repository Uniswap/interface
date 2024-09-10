import { SvgProps } from 'react-native-svg'
import { useDispatch } from 'react-redux'
import { useSettingsStackNavigation } from 'src/app/navigation/types'
import { Flex, Text, TouchableArea } from 'ui/src'
import UniswapIcon from 'ui/src/assets/icons/uniswap-logo.svg'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { resetWallet, setFinishedOnboarding } from 'wallet/src/features/wallet/slice'

export function OnboardingRow({ iconProps }: { iconProps: SvgProps }): JSX.Element {
  const dispatch = useDispatch()
  const navigation = useSettingsStackNavigation()
  const associatedAccounts = useSignerAccounts()

  const onPressReset = (): void => {
    const uniqueMnemonicIds = new Set(associatedAccounts.map((a) => a.mnemonicId))
    const accountAddresses = associatedAccounts.map((a) => a.address)
    Promise.all([[...uniqueMnemonicIds].map(Keyring.removeMnemonic), accountAddresses.map(Keyring.removePrivateKey)])
      .then(() => {
        navigation.goBack()
        dispatch(resetWallet())
        dispatch(setFinishedOnboarding({ finishedOnboarding: false }))
      })
      .catch((error) => {
        logger.error(error, {
          tags: { file: 'SettingsScreen', function: 'Keyring.removeMnemonic' },
        })
      })
  }

  return (
    <TouchableArea onPress={onPressReset}>
      <Flex row alignItems="center" justifyContent="space-between" py="$spacing4">
        <Flex row alignItems="center">
          <Flex centered height={32} width={32}>
            <UniswapIcon {...iconProps} />
          </Flex>
          <Text ml="$spacing12" variant="body1">
            Onboarding
          </Text>
        </Flex>
        <RotatableChevron color="$neutral3" direction="end" height={iconSizes.icon24} width={iconSizes.icon24} />
      </Flex>
    </TouchableArea>
  )
}
