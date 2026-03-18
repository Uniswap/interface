import { RouteProp } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React from 'react'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { RestoreCloudBackupScreen } from 'src/screens/Import/RestoreCloudBackupScreen'
import { render } from 'src/test/test-utils'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'

const setOptionsSpy = jest.fn()

const backups = [
  {
    mnemonicId: '123',
    createdAt: 1700000000000,
  },
  {
    mnemonicId: '456',
    createdAt: 1700000001000,
  },
]

const routeProp = { params: { backups } } as RouteProp<OnboardingStackParamList, OnboardingScreens.RestoreCloudBackup>

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
      />,
    ).toJSON()

    expect(tree).toMatchSnapshot()
  })
})
