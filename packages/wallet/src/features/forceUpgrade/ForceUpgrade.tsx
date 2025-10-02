import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Button, Flex, Image, Text, useSporeColors } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { imageSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { useForceUpgradeStatus } from 'uniswap/src/features/forceUpgrade/hooks/useForceUpgradeStatus'
import { useForceUpgradeTranslations } from 'uniswap/src/features/forceUpgrade/hooks/useForceUpgradeTranslations'
import { useLocalizedStatsigLanguage } from 'uniswap/src/features/language/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'
import { isExtensionApp, isIOS, isMobileApp, isWebPlatform } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { EXTENSION_FORCED_UPGRADE_HELP_LINK, MOBILE_APP_STORE_LINK } from 'wallet/src/constants/urls'
import { startAndroidInAppUpdate } from 'wallet/src/features/forceUpgrade/startAndroidInAppUpdate'
import { UpgradeStatus } from 'wallet/src/features/forceUpgrade/types'
import { SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

type Translation = {
  description?: string
  title?: string
}

interface ForceUpgradeProps {
  SeedPhraseModalContent: React.ComponentType<{ mnemonicId: string; onDismiss: () => void }>
}

export function ForceUpgrade({ SeedPhraseModalContent }: ForceUpgradeProps): JSX.Element | null {
  const forceUpgradeStatusString = useForceUpgradeStatus()

  const upgradeStatus = useMemo(() => {
    if (forceUpgradeStatusString === 'recommended') {
      return UpgradeStatus.Recommended
    }
    if (forceUpgradeStatusString === 'required') {
      return UpgradeStatus.Required
    }
    return UpgradeStatus.NotRequired
  }, [forceUpgradeStatusString])

  if (upgradeStatus === UpgradeStatus.NotRequired) {
    return null
  }

  return <ForceUpgradeModal SeedPhraseModalContent={SeedPhraseModalContent} upgradeStatus={upgradeStatus} />
}

function ForceUpgradeModal({
  SeedPhraseModalContent,
  upgradeStatus,
}: ForceUpgradeProps & { upgradeStatus: UpgradeStatus }): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const statsigLanguage = useLocalizedStatsigLanguage()

  const upgradeTextTranslations = useForceUpgradeTranslations()

  const { description: translatedDescription, title: translatedTitle } = useMemo<Translation>(() => {
    if (!statsigLanguage) {
      return { description: undefined, title: undefined }
    }

    const translation = upgradeTextTranslations[statsigLanguage]
    return translation
      ? { description: translation.description, title: translation.title }
      : { description: undefined, title: undefined }
  }, [upgradeTextTranslations, statsigLanguage])

  const shouldShow = upgradeStatus !== UpgradeStatus.NotRequired
  const [userDismissed, setUserDismissed] = useState(false)
  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  const isVisible = shouldShow && !userDismissed && !showSeedPhrase

  const isRecommended = upgradeStatus === UpgradeStatus.Recommended
  const titleText =
    translatedTitle ?? (isRecommended ? t('forceUpgrade.title.recommendedStatus') : t('forceUpgrade.title'))

  const descriptionText =
    translatedDescription ??
    (isMobileApp ? t('forceUpgrade.description.wallet') : t('forceUpgrade.description.extension'))

  // signerAccounts could be empty if no seed phrase imported or in onboarding
  const signerAccounts = useSignerAccounts()
  const mnemonicId = signerAccounts.length > 0 ? (signerAccounts[0] as SignerMnemonicAccount).mnemonicId : undefined

  const onClose = useEvent(() => {
    setUserDismissed(true)
  })

  const onPressConfirm = useEvent(async (): Promise<void> => {
    if (isRecommended) {
      onClose()
    }

    if (isExtensionApp) {
      await openUri({ uri: EXTENSION_FORCED_UPGRADE_HELP_LINK, openExternalBrowser: true, isSafeUri: true })
      return
    }

    if (isIOS) {
      // iOS doesn't support in-app updates, just open the App Store
      await openUri({ uri: MOBILE_APP_STORE_LINK, openExternalBrowser: true, isSafeUri: true })
      return
    }

    // Try using in-app updates for Android
    const updateStarted = await startAndroidInAppUpdate({ isRequired: !isRecommended })

    // If in-app update wasn't available or failed, fall back to store link
    if (!updateStarted) {
      await openUri({ uri: MOBILE_APP_STORE_LINK, openExternalBrowser: true, isSafeUri: true })
    }
  })

  const onPressViewRecovery = useEvent(() => {
    setShowSeedPhrase(true)
  })

  const onDismiss = useEvent(() => {
    setUserDismissed(false)
    setShowSeedPhrase(false)
  })

  // We do not add explicit error boundary here as we can not hide or replace
  // the force upgrade screen on error, hence we fallback to the global error boundary
  return (
    <>
      <Modal
        alignment="top"
        backgroundColor={colors.surface1.val}
        hideHandlebar={upgradeStatus === UpgradeStatus.Required}
        isDismissible={upgradeStatus !== UpgradeStatus.Required}
        isModalOpen={isVisible}
        name={ModalName.ForceUpgradeModal}
        onClose={onClose}
      >
        <Flex
          centered
          gap="$spacing24"
          pb={isWebPlatform ? '$none' : '$spacing12'}
          pt={upgradeStatus === UpgradeStatus.Required ? '$spacing24' : '$spacing12'}
          px={isWebPlatform ? '$none' : '$spacing24'}
        >
          <Flex
            centered
            width="100%"
            height={160}
            borderRadius="$rounded16"
            borderWidth="$spacing1"
            borderColor="$surface3"
            overflow="hidden"
          >
            <Flex
              centered
              borderRadius="$rounded16"
              style={{
                shadowColor: colors.accent1.val,
                elevation: 8,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
              }}
              borderWidth="$spacing1"
              borderColor="$surface3"
              elevationAndroid={8}
            >
              <Flex position="relative">
                <Image
                  height={imageSizes.image64}
                  resizeMode="contain"
                  source={UNISWAP_LOGO}
                  width={imageSizes.image64}
                />
                <Flex position="absolute" top={-15} right={-8} transform={[{ rotate: '10deg' }]}>
                  <NewTag exclamation backgroundColor="$accent1" textColor="$white" />
                </Flex>
              </Flex>
            </Flex>
            <BackgroundDotPattern />
          </Flex>
          <Flex gap="$spacing8">
            <Text textAlign="center" variant="subheading1">
              {titleText}
            </Text>
            <Text color="$neutral2" textAlign="center" variant="body3">
              {descriptionText}
            </Text>
          </Flex>
          <Flex centered gap="$spacing8" pb={isWebPlatform ? '$none' : '$spacing12'} width="100%">
            <Flex row width="100%">
              <Button size="medium" variant="branded" onPress={onPressConfirm}>
                {isMobileApp ? t('forceUpgrade.action.confirm') : t('forceUpgrade.action.learn')}
              </Button>
            </Flex>

            {upgradeStatus === UpgradeStatus.Required ? (
              mnemonicId && (
                <Flex row width="100%">
                  <Button size="medium" emphasis="secondary" onPress={onPressViewRecovery}>
                    {t('forceUpgrade.action.backup')}
                  </Button>
                </Flex>
              )
            ) : (
              <Flex row width="100%">
                <Button size="medium" emphasis="secondary" onPress={onClose}>
                  {t('common.button.notNow')}
                </Button>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Modal>

      {mnemonicId && showSeedPhrase && (
        <Modal
          alignment="top"
          fullScreen={isMobileApp}
          // on extension, needs to be un-dismissible so that the only way to exit seed phrase view is to press the back button
          isDismissible={isMobileApp}
          backgroundColor={colors.surface1.val}
          name={ModalName.ForceUpgradeModal}
          onClose={onDismiss}
        >
          <SeedPhraseModalContent mnemonicId={mnemonicId} onDismiss={onDismiss} />
        </Modal>
      )}
    </>
  )
}

function BackgroundDotPattern(): JSX.Element {
  const colors = useSporeColors()
  const dotGrid = useMemo(() => {
    return Array.from({ length: 100 }).map((_, row) => {
      return Array.from({ length: 100 }).map((__, col) => {
        const x = col * 2 + 1
        const y = row * 2 + 1

        const distX = Math.abs(x - 50)
        const distY = Math.abs(y - 50)
        const dist = Math.sqrt(distX * distX + distY * distY)

        if (dist < 45) {
          const size = 0.1 + (45 - dist) / 20

          return <Circle key={`${row}-${col}`} cx={`${x}%`} cy={`${y}%`} r={size} fill={colors.pinkThemed.val} />
        }
        return null
      })
    })
  }, [colors])

  return (
    <Svg width={400} height={400} style={[styles.backgroundPattern, styles.centered]}>
      {dotGrid}
    </Svg>
  )
}

const styles = StyleSheet.create({
  backgroundPattern: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: -1,
  },
  centered: {
    left: '50%',
    top: '50%',
    transform: [{ translateX: -200 }, { translateY: -200 }],
  },
})
