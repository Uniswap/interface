import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { findNodeHandle, StyleSheet, UIManager } from 'react-native'
import { useNativeComponentKey } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { NativeSeedPhraseInput } from 'src/screens/Import/SeedPhraseInputScreen/SeedPhraseInput/NativeSeedPhraseInput'
import {
  NativeSeedPhraseInputInternalProps,
  NativeSeedPhraseInputProps,
  NativeSeedPhraseInputRef,
} from 'src/screens/Import/SeedPhraseInputScreen/SeedPhraseInput/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { isAndroid } from 'utilities/src/platform'

const styles = StyleSheet.create({
  input: {
    flex: 1,
    flexGrow: 1,
  },
})

type SeedPhraseInputProps = NativeSeedPhraseInputProps & {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, OnboardingScreens.SeedPhraseInput>
}

export const SeedPhraseInput = forwardRef<NativeSeedPhraseInputRef, SeedPhraseInputProps>(function _SeedPhraseInput(
  { navigation, ...rest },
  ref,
) {
  const [height, setHeight] = useState(0)
  const { key, triggerUpdate } = useNativeComponentKey(isAndroid)
  const inputRef = useRef<NativeSeedPhraseInputRef>(null)

  const calculatedStyle = useMemo(() => [styles.input, { minHeight: height }], [height])

  const handleOnHeightMeasured: NativeSeedPhraseInputInternalProps['onHeightMeasured'] = (e) => {
    // Round to limit state updates (was called with nearly the same value multiple times)

    setHeight(Math.round(e.nativeEvent.height))
  }

  useEffect(() => {
    // Trigger update when the transition finishes to ensure the native component is mounted
    // and auto-focus works correctly
    return navigation.addListener('transitionEnd', triggerUpdate)
  }, [navigation, triggerUpdate])

  useImperativeHandle(ref, () => ({
    handleSubmit: (): void => {
      // @ts-expect-error - TODO: figure out how to properly type this
      const node = findNodeHandle(inputRef.current)

      UIManager.dispatchViewManagerCommand(node, 'handleSubmit', [])
    },
    focus: (): void => {
      // @ts-expect-error - TODO: figure out how to properly type this
      const node = findNodeHandle(inputRef.current)

      UIManager.dispatchViewManagerCommand(node, 'focus', [])
    },
    blur: (): void => {
      // @ts-expect-error - TODO: figure out how to properly type this
      const node = findNodeHandle(inputRef.current)

      UIManager.dispatchViewManagerCommand(node, 'blur', [])
    },
  }))

  return (
    <NativeSeedPhraseInput
      // @ts-expect-error - TODO: figure out how to properly type the ref of a custom native component
      ref={inputRef}
      key={key}
      testID={TestID.NativeSeedPhraseInput}
      style={calculatedStyle}
      onHeightMeasured={handleOnHeightMeasured}
      {...rest}
    />
  )
})
