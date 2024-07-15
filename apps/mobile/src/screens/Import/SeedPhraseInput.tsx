import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { forwardRef, RefObject, useEffect, useState } from 'react'
import { findNodeHandle, NativeSyntheticEvent, requireNativeComponent, StyleSheet, UIManager } from 'react-native'
import { useNativeComponentKey } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { isAndroid } from 'utilities/src/platform'

export type MnemonicStoredEvent = {
  mnemonicId: string
}
export type InputValidatedEvent = {
  canSubmit: boolean
}
type HeightMeasuredEvent = {
  height: number
}

export enum StringKey {
  InputPlaceholder = 'inputPlaceholder',
  PasteButton = 'pasteButton',
  ErrorInvalidWord = 'errorInvalidWord',
  ErrorPhraseLength = 'errorPhraseLength',
  ErrorWrongPhrase = 'errorWrongPhrase',
  ErrorInvalidPhrase = 'errorInvalidPhrase',
}
interface NativeSeedPhraseInputProps {
  targetMnemonicId?: string
  testID?: string
  strings: Record<StringKey, string>
  onInputValidated: (e: NativeSyntheticEvent<InputValidatedEvent>) => void
  onMnemonicStored: (e: NativeSyntheticEvent<MnemonicStoredEvent>) => void

  // Only needed on iOS to determine when paste permission modal is open, which triggers inactive app state
  // And we need to prevent splash screen from appearing
  onPasteStart: () => void
  onPasteEnd: () => void
}

const NativeSeedPhraseInput = requireNativeComponent<
  NativeSeedPhraseInputProps & {
    onHeightMeasured: (e: NativeSyntheticEvent<HeightMeasuredEvent>) => void
  }
>('SeedPhraseInput')
export type NativeSeedPhraseInputRef = typeof NativeSeedPhraseInput & { handleSubmit: () => void }

const styles = StyleSheet.create({
  input: {
    flex: 1,
    flexGrow: 1,
  },
})

export function handleSubmit(ref: RefObject<NativeSeedPhraseInputRef>): void {
  UIManager.dispatchViewManagerCommand(findNodeHandle(ref.current), 'handleSubmit', [])
}

type SeedPhraseInputProps = NativeSeedPhraseInputProps & {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, OnboardingScreens.SeedPhraseInput>
}

export const SeedPhraseInput = forwardRef<NativeSeedPhraseInputRef, SeedPhraseInputProps>(
  ({ navigation, ...rest }, ref) => {
    const [height, setHeight] = useState(0)
    const { key, triggerUpdate } = useNativeComponentKey(isAndroid)

    useEffect(() => {
      // Trigger update when the transition finishes to ensure the native component is mounted
      // and auto-focus works correctly
      return navigation.addListener('transitionEnd', triggerUpdate)
    }, [navigation, triggerUpdate])

    return (
      <NativeSeedPhraseInput
        key={key}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ref={ref}
        style={[styles.input, { minHeight: height }]}
        {...rest}
        onHeightMeasured={(e) => {
          // Round to limit state updates (was called with nearly the same value multiple times)
          setHeight(Math.round(e.nativeEvent.height))
        }}
      />
    )
  },
)
SeedPhraseInput.displayName = 'NativeSeedPhraseInput'
