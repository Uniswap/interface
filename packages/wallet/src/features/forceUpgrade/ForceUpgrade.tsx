import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useForceUpgradeStatus } from 'uniswap/src/features/forceUpgrade/hooks/useForceUpgradeStatus'
import { useForceUpgradeTranslations } from 'uniswap/src/features/forceUpgrade/hooks/useForceUpgradeTranslations'
import { useLocalizedStatsigLanguage } from 'uniswap/src/features/language/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'
import { isExtensionApp, isIOS, isMobileApp } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { EXTENSION_FORCED_UPGRADE_HELP_LINK, MOBILE_APP_STORE_LINK } from 'wallet/src/constants/urls'
import { ForceUpgradeModalContent } from 'wallet/src/features/forceUpgrade/ForceUpgradeModalContent'
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

  const titleText =
    translatedTitle ??
    (upgradeStatus === UpgradeStatus.Recommended ? t('forceUpgrade.title.recommendedStatus') : t('forceUpgrade.title'))

  const descriptionText =
    translatedDescription ??
    (isMobileApp ? t('forceUpgrade.description.wallet') : t('forceUpgrade.description.extension'))

  // signerAccounts could be empty if no seed phrase imported or in onboarding
  const signerAccounts = useSignerAccounts()
  const mnemonicId = signerAccounts.length > 0 ? (signerAccounts[0] as SignerMnemonicAccount).mnemonicId : undefined

  const onClose = useEvent(() => {
    setUserDismissed(true)
  })

  const isRequired = upgradeStatus === UpgradeStatus.Required

  const onPressConfirm = useEvent(async (): Promise<void> => {
    if (!isRequired) {
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
    const updateStarted = await startAndroidInAppUpdate({ isRequired })

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

  const updateButtonLabel = isMobileApp ? t('forceUpgrade.action.confirm') : t('forceUpgrade.action.learn')

  // We do not add explicit error boundary here as we can not hide or replace
  // the force upgrade screen on error, hence we fallback to the global error boundary
  return (
    <>
      <Modal
        alignment="top"
        backgroundColor={colors.surface1.val}
        hideHandlebar={isRequired}
        isDismissible={!isRequired}
        isModalOpen={isVisible}
        name={ModalName.ForceUpgradeModal}
        onClose={onClose}
      >
        <ForceUpgradeModalContent
          title={titleText}
          description={descriptionText}
          isRequired={isRequired}
          hasMnemonic={!!mnemonicId}
          updateButtonLabel={updateButtonLabel}
          onPressUpdate={onPressConfirm}
          onPressBackup={onPressViewRecovery}
          onPressNotNow={onClose}
        />
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
