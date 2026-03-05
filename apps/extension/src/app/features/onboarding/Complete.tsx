import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OpenSidebarButton } from 'src/app/components/buttons/OpenSidebarButton'
import { useFinishExtensionOnboarding } from 'src/app/features/onboarding/hooks/useFinishExtensionOnboarding'
import { useOpenSidebar } from 'src/app/features/onboarding/hooks/useOpenSidebar'
import { MainContentWrapper } from 'src/app/features/onboarding/intro/MainContentWrapper'
import { KeyboardKey } from 'src/app/features/onboarding/KeyboardKey'
import { useOpeningKeyboardShortCut } from 'src/app/hooks/useOpeningKeyboardShortCut'
import { terminateStoreSynchronization } from 'src/store/storeSynchronization'
import { Flex, Image, Text } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { iconSizes } from 'ui/src/theme'
import { ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'

export function Complete({
  flow,
  tryToClaimUnitag,
}: {
  flow?: ExtensionOnboardingFlow
  tryToClaimUnitag?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { getOnboardingAccountAddress, addUnitagClaim, getUnitagClaim } = useOnboardingContext()
  const address = getOnboardingAccountAddress()
  const existingClaim = getUnitagClaim()
  const [unitagClaimAttempted, setUnitagClaimAttempted] = useState(false)
  const { openedSideBar, handleOpenSidebar, handleOpenWebApp } = useOpenSidebar()

  useEffect(() => {
    if (!tryToClaimUnitag || !address || unitagClaimAttempted) {
      return
    }

    setUnitagClaimAttempted(true)
    if (existingClaim?.username) {
      addUnitagClaim({ address, username: existingClaim.username })
    }
  }, [existingClaim, address, tryToClaimUnitag, unitagClaimAttempted, addUnitagClaim])

  // Activates onboarding accounts on component mount
  useFinishExtensionOnboarding({
    callback: terminateStoreSynchronization,
    extensionOnboardingFlow: flow,
    skip: tryToClaimUnitag && !unitagClaimAttempted,
  })

  const keys = useOpeningKeyboardShortCut(openedSideBar)

  return (
    <MainContentWrapper>
      <Flex alignItems="center">
        <Flex alignItems="center" gap="$spacing24" justifyContent="center">
          <Flex alignItems="center" gap="$spacing12" justifyContent="center">
            <Image height={iconSizes.icon64} source={UNISWAP_LOGO} width={iconSizes.icon64} />
            <Text color="$neutral1" variant="heading3">
              {t('onboarding.complete.title')}
            </Text>
            <Text color="$neutral2" px="$spacing36" textAlign="center" variant="body3">
              {t('onboarding.complete.description')}
            </Text>
          </Flex>
          <Flex row alignItems="center" gap="$spacing20" justifyContent="space-between" mb="$spacing48" mt="$spacing24">
            {keys.map((key) => (
              <KeyboardKey key={key.title} fontSize={key.fontSize} px={key.px} state={key.state} title={key.title} />
            ))}
          </Flex>
          <OpenSidebarButton
            openedSideBar={openedSideBar}
            handleOpenSidebar={handleOpenSidebar}
            handleOpenWebApp={handleOpenWebApp}
          />
        </Flex>
      </Flex>
    </MainContentWrapper>
  )
}
