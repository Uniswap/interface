import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { renderHook } from 'src/test/test-utils'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'

const setOptionsSpy = jest.fn()

describe(useNavigationHeader, () => {
  it('sets navigation options when item is first in stack', () => {
    renderHook(() =>
      useNavigationHeader({
        getState: () => ({
          index: 0,
        }),
        setOptions: setOptionsSpy,
      } as unknown as NativeStackNavigationProp<OnboardingStackParamList>),
    )

    expect(setOptionsSpy).toHaveBeenCalled()
  })
})
