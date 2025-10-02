import { useHeaderHeight } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { navigate } from 'src/app/navigation/rootNavigation'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { PasskeyImportLoading } from 'wallet/src/features/onboarding/PasskeyImportLoading'
import { WelcomeSplash } from 'wallet/src/features/onboarding/WelcomeSplash'
import { fetchSeedPhrase } from 'wallet/src/features/passkeys/passkeys'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.PasskeyImport>

export function PasskeyImportScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { generateImportedAccounts } = useOnboardingContext()
  const headerHeight = useHeaderHeight()
  const [address, setAddress] = useState<Address | null>(null)

  const onContinue = useEvent(() => {
    navigation.navigate({
      name: OnboardingScreens.SelectWallet,
      params,
      merge: true,
    })
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: We want to import the mnemonic only once
  useEffect(() => {
    const importAndGenerateAccount = async (): Promise<void> => {
      const mnemonic = await fetchSeedPhrase(params.passkeyCredential)
      const importedAddress = await Keyring.importMnemonic(mnemonic)
      await generateImportedAccounts({ mnemonicId: importedAddress, backupType: BackupType.Passkey })
      if (!importedAddress) {
        throw new Error(`Failed to generate account for mnemonic ${mnemonic}`)
      }

      setAddress(importedAddress)
    }

    importAndGenerateAccount().catch((error: Error) => {
      logger.error(error, {
        tags: {
          file: 'PasskeyImportScreen.tsx',
          function: 'importAndGenerateAccount',
        },
      })

      navigation.goBack()
      navigate(ModalName.PasskeysHelp)
    })
  }, [])

  return (
    <OnboardingScreen disableGoBack={false}>
      {address ? (
        <WelcomeSplash address={address} pb={headerHeight} onContinue={onContinue} />
      ) : (
        <PasskeyImportLoading pb={headerHeight} />
      )}
    </OnboardingScreen>
  )
}
