import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { renderHook } from 'src/test/test-utils'
import { useAddBackButton } from 'src/utils/useAddBackButton'

const setOptionsSpy = jest.fn()

describe(useAddBackButton, () => {
  it('sets navigation options when item is first in stack', () => {
    renderHook(() =>
      useAddBackButton({
        getState: () => ({
          index: 0,
        }),
        setOptions: setOptionsSpy,
      } as unknown as NativeStackNavigationProp<OnboardingStackParamList>)
    )

    expect(setOptionsSpy).toHaveBeenCalled()
  })

  it("doesn't set navigation options for subsequent stack levels", () => {
    renderHook(() =>
      useAddBackButton({
        getState: () => ({
          index: 1,
        }),
        setOptions: setOptionsSpy,
      } as unknown as NativeStackNavigationProp<OnboardingStackParamList>)
    )

    expect(setOptionsSpy).not.toHaveBeenCalled()
  })
})
