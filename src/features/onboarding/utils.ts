import { OnboardingScreens } from 'src/screens/Screens'

export enum ImportType {
  Create = 'Create',
  SeedPhrase = 'SeedPhrase',
  PrivateKey = 'PrivateKey',
  Watch = 'Watch',
  Restore = 'Restore',
}

// Screens in order based on the import method being used.
const FLOWS: Record<ImportType, OnboardingScreens[]> = {
  [ImportType.Create]: [
    OnboardingScreens.EditName,
    OnboardingScreens.SelectColor,
    OnboardingScreens.Backup,
    OnboardingScreens.Notifications,
    OnboardingScreens.Security,
  ],
  [ImportType.SeedPhrase]: [
    OnboardingScreens.SeedPhraseInput,
    OnboardingScreens.SelectWallet,
    OnboardingScreens.Notifications,
    OnboardingScreens.Security,
  ],
  [ImportType.PrivateKey]: [
    OnboardingScreens.PrivateKeyInput,
    OnboardingScreens.EditName,
    OnboardingScreens.SelectColor,
    OnboardingScreens.Notifications,
    OnboardingScreens.Security,
  ],
  [ImportType.Watch]: [
    OnboardingScreens.WatchWallet,
    OnboardingScreens.Notifications,
    OnboardingScreens.Security,
  ],
  // @TODO Fill out restore flow.
  [ImportType.Restore]: [],
}

// Get the total amount of steps based on the import method type.
export function getStepCount(importType: ImportType | undefined) {
  if (!importType) return undefined
  return FLOWS[importType]?.length ?? undefined
}

// Reference the flow description to detect the index within total steps based on screen name.
export function getStepNumber(
  importType: ImportType | undefined,
  screenName: OnboardingScreens | undefined
) {
  if (!screenName || !importType) return undefined
  const stepNumber = FLOWS[importType].indexOf(screenName)
  return stepNumber === -1 ? undefined : stepNumber
}
