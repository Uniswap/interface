import { RouteProp } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React from 'react'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { RestoreCloudBackupPasswordScreen } from 'src/screens/Import/RestoreCloudBackupPasswordScreen'
import { OnboardingScreens } from 'src/screens/Screens'
import { render } from 'src/test/test-utils'
import { TamaguiProvider } from 'wallet/src/provider/tamagui-provider'

const setOptionsSpy = jest.fn()
const routeProp = { params: {} } as RouteProp<
  OnboardingStackParamList,
  OnboardingScreens.RestoreCloudBackupPassword
>

describe(RestoreCloudBackupPasswordScreen, () => {
  it('renders correctly', () => {
    const tree = render(
      <TamaguiProvider>
        <RestoreCloudBackupPasswordScreen
          navigation={
            {
              getState: () => ({
                index: 0,
              }),
              setOptions: setOptionsSpy,
            } as unknown as NativeStackNavigationProp<
              OnboardingStackParamList,
              OnboardingScreens.RestoreCloudBackupPassword,
              undefined
            >
          }
          route={routeProp}
        />
      </TamaguiProvider>
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
