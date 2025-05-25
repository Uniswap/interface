import React from 'react'
import { OSDynamicCloudIcon, PaperStack, Passkey } from 'ui/src/components/icons'
import { AppTFunction } from 'ui/src/i18n/types'
import { ElementName, ElementNameType } from 'uniswap/src/features/telemetry/constants'
import { TestID, TestIDType } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { isAndroid } from 'utilities/src/platform'

export interface ImportMethodOption {
  title: (t: AppTFunction) => string
  blurb: (t: AppTFunction) => string
  icon: React.ReactNode
  nav: OnboardingScreens
  importType: ImportType
  name: ElementNameType
  testID: TestIDType
}

/**
 * Sign in with Passkey
 */
export const passKeySignInOption: ImportMethodOption = {
  title: (t: AppTFunction) => t('onboarding.import.selectMethod.passkey.title'),
  blurb: (t: AppTFunction) => t('onboarding.import.selectMethod.passkey.subtitle'),
  icon: <Passkey color="$accent1" size="$icon.18" />,
  nav: OnboardingScreens.PasskeyImport,
  importType: ImportType.Passkey,
  name: ElementName.OnboardingPasskey,
  testID: TestID.OnboardingPasskey,
}

/**
 * Import with Seed Phrase
 */
export const seedPhraseImportOption: ImportMethodOption = {
  title: (t: AppTFunction) => t('onboarding.import.selectMethod.recoveryPhrase.title'),
  blurb: (t: AppTFunction) => t('onboarding.import.selectMethod.recoveryPhrase.subtitle'),
  icon: <PaperStack color="$accent1" size="$icon.18" strokeWidth={1.5} />,
  nav: OnboardingScreens.SeedPhraseInput,
  importType: ImportType.SeedPhrase,
  name: ElementName.OnboardingImportSeedPhrase,
  testID: TestID.OnboardingImportSeedPhrase,
}

/**
 * Restore wallet with Seed Phrase.
 *
 * This will not allow a seed phrase that does not match the active wallet.
 */
export const restoreWalletWithSeedPhraseOption: ImportMethodOption = {
  title: (t: AppTFunction) => t('onboarding.import.method.restoreSeedPhrase.wallet.title'),
  blurb: (t: AppTFunction) => t('onboarding.import.method.restoreSeedPhrase.wallet.desc'),
  icon: <PaperStack color="$accent1" size="$icon.18" strokeWidth={1.5} />,
  nav: OnboardingScreens.SeedPhraseInput,
  importType: ImportType.RestoreMnemonic,
  name: ElementName.OnboardingImportSeedPhrase,
  testID: TestID.OnboardingImportSeedPhrase,
}

/**
 * Import from Cloud (iCloud/GDrive) Backup
 */
export const importFromCloudBackupOption: ImportMethodOption = {
  title: (t: AppTFunction) => t('onboarding.import.method.restore.title'),
  blurb: (t: AppTFunction) =>
    isAndroid
      ? t(`onboarding.import.method.restore.message.android`)
      : t(`onboarding.import.method.restore.message.ios`),
  icon: <OSDynamicCloudIcon color="$accent1" size="$icon.18" />,
  nav: OnboardingScreens.RestoreCloudBackup,
  importType: ImportType.Restore,
  name: ElementName.RestoreFromCloud,
  testID: TestID.RestoreFromCloud,
}

/**
 * Restore from Cloud (iCloud/GDrive) Backup. Checks if the cloud backup matches the active wallet.
 */
export const restoreFromCloudBackupOption: ImportMethodOption = {
  title: (t: AppTFunction) =>
    isAndroid
      ? t('onboarding.import.method.restoreSeedPhrase.cloud.title.android')
      : t('onboarding.import.method.restoreSeedPhrase.cloud.title.ios'),
  blurb: (t: AppTFunction) =>
    isAndroid
      ? t('onboarding.import.method.restoreSeedPhrase.cloud.desc.android')
      : t('onboarding.import.method.restoreSeedPhrase.cloud.desc.ios'),
  icon: <OSDynamicCloudIcon color="$accent1" size="$icon.18" />,
  nav: OnboardingScreens.RestoreCloudBackupLoading,
  importType: ImportType.RestoreMnemonic,
  name: ElementName.RestoreFromCloud,
  testID: TestID.RestoreFromCloud,
}
