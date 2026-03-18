import { createContext, useContext } from 'react'
import { OnboardingScreenProps } from 'src/app/features/onboarding/OnboardingScreenProps'

export enum CreateOnboardingSteps {
  ClaimUnitag = 'claimUnitag',
  Password = 'password',
  Complete = 'complete',
}

export enum SelectImportMethodSteps {
  SelectMethod = 'selectMethod',
}

export enum ImportPasskeySteps {
  InitiatePasskeyAuth = 'initiatePasskeyAuth',
  PasskeyImport = 'passkeyImport',
}

export enum ImportOnboardingSteps {
  Mnemonic = 'mnemonic',
  Password = 'password',
  Select = 'select',
  Backup = 'backup',
  Complete = 'complete',
}

export enum ResetSteps {
  Mnemonic = 'mnemonic',
  Password = 'password',
  Complete = 'complete',
  Select = 'select',
}

export enum ScanOnboardingSteps {
  Password = 'password',
  Scan = 'scan',
  OTP = 'otp',
  Select = 'select',
  Complete = 'complete',
}

export enum ClaimUnitagSteps {
  Intro = 'intro',
  CreateUsername = 'createUsername',
  ChooseProfilePic = 'chooseProfilePic',
  EditProfile = 'editProfile',
  Confirmation = 'confirmation',
}

export type Step =
  | CreateOnboardingSteps
  | ImportOnboardingSteps
  | ResetSteps
  | ScanOnboardingSteps
  | ClaimUnitagSteps
  | SelectImportMethodSteps
  | ImportPasskeySteps
export type OnboardingStepsContextState = {
  step: Step
  going?: 'forward' | 'backward'
  setStep: (step: Step) => void
  setOnboardingScreen: (screen: OnboardingScreenProps) => void
  clearOnboardingScreen: (screen: OnboardingScreenProps) => void
  goToNextStep: () => void
  goToPreviousStep: () => void
  isResetting: boolean
}

export const OnboardingStepsContext = createContext<OnboardingStepsContextState | undefined>(undefined)

export function useOnboardingSteps(): OnboardingStepsContextState {
  const onboardingStepsContext = useContext(OnboardingStepsContext)

  if (onboardingStepsContext === undefined) {
    throw new Error('`useOnboardingSteps` must be used inside of `OnboardingStepsProvider`')
  }

  return onboardingStepsContext
}
