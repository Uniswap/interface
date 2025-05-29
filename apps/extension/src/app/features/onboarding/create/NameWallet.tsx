import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from 'src/app/components/Input'
import { saveDappConnection } from 'src/app/features/dapp/actions'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { Flex, Text, Unicon } from 'ui/src'
import { fonts, iconSizes } from 'ui/src/theme'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { shortenAddress } from 'utilities/src/addresses'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'

export function NameWallet(): JSX.Element {
  const { t } = useTranslation()
  const { getOnboardingAccount, setPendingWalletName } = useOnboardingContext()
  const onboardingAccount = getOnboardingAccount()

  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()
  const [walletName, setWalletName] = useState('')

  const onboardingAccountAddress = onboardingAccount?.address

  const onSubmit = async (): Promise<void> => {
    if (walletName) {
      setPendingWalletName(walletName)
    }

    if (onboardingAccount) {
      await saveDappConnection(UNISWAP_WEB_URL, onboardingAccount)
    }

    goToNextStep()
  }

  return (
    <Trace
      logImpression
      properties={{ flow: ExtensionOnboardingFlow.New }}
      screen={ExtensionOnboardingScreens.NameWallet}
    >
      <OnboardingScreen
        Icon={
          onboardingAccountAddress ? <Unicon address={onboardingAccountAddress} size={iconSizes.icon64} /> : undefined
        }
        nextButtonEnabled={true}
        nextButtonText={t('onboarding.name.wallet.button.text')}
        subtitle={t('onboarding.name.wallet.subtitle')}
        title={t('onboarding.name.wallet.title')}
        onBack={goToPreviousStep}
        onSubmit={onSubmit}
      >
        <Flex gap="$spacing24" py="$spacing24" width="100%">
          <Input
            autoFocus
            large
            backgroundColor="$surface1"
            borderRadius="$rounded20"
            fontSize={fonts.heading3.fontSize}
            placeholder={onboardingAccount?.name}
            py="$spacing32"
            textAlign="center"
            onChangeText={setWalletName}
            onSubmitEditing={onSubmit}
          />
          <Text color="$neutral3" textAlign="center" variant="subheading2">
            {onboardingAccountAddress && shortenAddress(onboardingAccountAddress)}
          </Text>
        </Flex>
      </OnboardingScreen>
    </Trace>
  )
}
