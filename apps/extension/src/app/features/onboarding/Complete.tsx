import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MainContentWrapper } from 'src/app/features/onboarding/intro/MainContentWrapper'
import { KeyboardKey } from 'src/app/features/onboarding/KeyboardKey'
import { useFinishExtensionOnboarding } from 'src/app/features/onboarding/useFinishExtensionOnboarding'
import { useOpeningKeyboardShortCut } from 'src/app/hooks/useOpeningKeyboardShortCut'
import { getCurrentTabAndWindowId } from 'src/app/navigation/utils'
import { onboardingMessageChannel } from 'src/background/messagePassing/messageChannels'
import { OnboardingMessageType } from 'src/background/messagePassing/types/ExtensionMessages'
import { openSidePanel } from 'src/background/utils/chromeSidePanelUtils'
import { terminateStoreSynchronization } from 'src/store/storeSynchronization'
import { Button, Flex, Image, Text } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { RightArrow } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'
import { logger } from 'utilities/src/logger/logger'
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
  const [openedSideBar, setOpenedSideBar] = useState(false)

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

  useEffect(() => {
    const onSidebarOpenedListener = onboardingMessageChannel.addMessageListener(
      OnboardingMessageType.SidebarOpened,
      (_message) => {
        setOpenedSideBar(true)
      },
    )
    return () => {
      onboardingMessageChannel.removeMessageListener(OnboardingMessageType.SidebarOpened, onSidebarOpenedListener)
    }
  }, [])

  const handleOpenWebApp = async (): Promise<void> => {
    window.location.href = uniswapUrls.webInterfaceSwapUrl
  }

  const handleOpenSidebar = async (): Promise<void> => {
    try {
      const { tabId, windowId } = await getCurrentTabAndWindowId()
      await openSidePanel(tabId, windowId)
    } catch (error) {
      logger.error(error, {
        tags: { file: 'onboarding/Complete.tsx', function: 'handleOpenSidebar' },
      })
    }
  }

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
          <Flex row alignSelf="stretch">
            <Button
              icon={openedSideBar ? <RightArrow /> : undefined}
              iconPosition="after"
              size="large"
              variant={openedSideBar ? 'branded' : 'default'}
              emphasis={openedSideBar ? 'primary' : 'secondary'}
              onPress={openedSideBar ? handleOpenWebApp : handleOpenSidebar}
            >
              {openedSideBar ? t('onboarding.complete.go_to_uniswap') : t('onboarding.complete.button')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </MainContentWrapper>
  )
}
