import type { HeaderTitleProps } from '@react-navigation/elements'
import React from 'react'
import { useOnboardingStackNavigation } from 'src/app/navigation/types'
import { Indicator } from 'src/components/carousel/Indicator'
import { useBiometricAppSettings } from 'src/features/biometrics/hooks'
import { getFlow, getStepNumber, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { useNativeAccountExists } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'

export const OnboardingHeader = ({ children: routeName }: HeaderTitleProps): JSX.Element | null => {
  const navigation = useOnboardingStackNavigation()
  const navigationState = navigation.getState()
  const importType = navigationState.routes[navigationState.index]?.params?.importType
  const hasSeedPhrase = useNativeAccountExists()
  const { requiredForTransactions: isBiometricAuthEnabled } = useBiometricAppSettings()
  const isInitialOnboarding =
    navigationState.routes[navigationState.index]?.params?.entryPoint ===
    OnboardingEntryPoint.FreshInstallOrReplace

  if (!importType) return null

  const flow = getFlow(importType, isBiometricAuthEnabled, hasSeedPhrase, isInitialOnboarding)
  const stepNumber = getStepNumber(flow, routeName as OnboardingScreens)
  const stepCount = flow.length

  if (stepCount !== 0 && stepNumber !== undefined) {
    return <Indicator currentStep={stepNumber} stepCount={stepCount} />
  }
  return null
}
