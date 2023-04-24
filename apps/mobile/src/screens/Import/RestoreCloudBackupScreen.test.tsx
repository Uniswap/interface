import { RouteProp } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React from 'react'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { RestoreCloudBackupScreen } from 'src/screens/Import/RestoreCloudBackupScreen'
import { OnboardingScreens } from 'src/screens/Screens'
import { render } from 'src/test/test-utils'

const setOptionsSpy = jest.fn()
const routeProp = { params: {} } as RouteProp<
  OnboardingStackParamList,
  OnboardingScreens.RestoreCloudBackup
>

describe(RestoreCloudBackupScreen, () => {
  it('renders correctly', () => {
    const tree = render(
      <RestoreCloudBackupScreen
        navigation={
          {
            getState: () => ({
              index: 0,
            }),
            setOptions: setOptionsSpy,
          } as unknown as NativeStackNavigationProp<
            OnboardingStackParamList,
            OnboardingScreens.RestoreCloudBackup,
            undefined
          >
        }
        route={routeProp}
      />
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
