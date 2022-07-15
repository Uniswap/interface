import type { HeaderTitleProps } from '@react-navigation/elements'
import React from 'react'
import { useOnboardingStackNavigation } from 'src/app/navigation/types'
import { Indicator } from 'src/components/carousel/Indicator'
import { getFlow, getStepNumber, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { useIsBiometricAuthEnabled, useNativeAccountExists } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'

const OnboardingHeader = ({ children: routeName }: HeaderTitleProps) => {
  const navigation = useOnboardingStackNavigation()
  const navigationState = navigation.getState()
  const importType = navigationState.routes[navigationState.index]?.params?.importType
  const hasSeedPhrase = useNativeAccountExists()
  const isBiometricAuthEnabled = useIsBiometricAuthEnabled()
  const isInitialOnboarding =
    navigationState.routes[navigationState.index]?.params?.entryPoint ===
    OnboardingEntryPoint.FreshInstall

  if (!importType) return null

  const flow = getFlow(importType, isBiometricAuthEnabled, hasSeedPhrase, isInitialOnboarding)
  const stepNumber = getStepNumber(flow, routeName as OnboardingScreens)
  const stepCount = flow.length

  if (stepCount !== 0 && stepNumber !== undefined) {
    return <Indicator currentStep={stepNumber} stepCount={stepCount} />
  }
  return null
}

export default OnboardingHeader
