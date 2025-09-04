import { useDispatch } from 'react-redux'
import { useSettingsStackNavigation } from 'src/app/navigation/types'
import { Flex, IconProps, Text, TouchableArea } from 'ui/src'
import { RotatableChevron, UniswapLogo } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { resetUniswapBehaviorHistory } from 'uniswap/src/features/behaviorHistory/slice'
import { logger } from 'utilities/src/logger/logger'
import { resetWalletBehaviorHistory } from 'wallet/src/features/behaviorHistory/slice'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { resetWallet, setFinishedOnboarding } from 'wallet/src/features/wallet/slice'

export function OnboardingRow({ iconProps }: { iconProps: IconProps }): JSX.Element {
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
        dispatch(resetWalletBehaviorHistory())
        dispatch(resetUniswapBehaviorHistory())
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
            <UniswapLogo {...iconProps} />
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
