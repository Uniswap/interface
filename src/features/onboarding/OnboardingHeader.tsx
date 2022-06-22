import type { HeaderTitleProps } from '@react-navigation/elements'
import React from 'react'
import { useOnboardingStackNavigation } from 'src/app/navigation/types'
import { Indicator } from 'src/components/carousel/Indicator'
import { getStepCount, getStepNumber } from 'src/features/onboarding/utils'
import { OnboardingScreens } from 'src/screens/Screens'

const OnboardingHeader = ({ children: routeName }: HeaderTitleProps) => {
  const navigation = useOnboardingStackNavigation()
  const navigationState = navigation.getState()
  const importType = navigationState.routes[navigationState.index]?.params?.importType

  const stepNumber = getStepNumber(importType, routeName as OnboardingScreens)
  const stepCount = getStepCount(importType)

  if (stepCount !== undefined && stepNumber !== undefined) {
    return <Indicator currentStep={stepNumber} stepCount={stepCount} />
  }
  return null
}

export default OnboardingHeader
