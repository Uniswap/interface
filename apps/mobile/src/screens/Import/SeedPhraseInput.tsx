import { forwardRef, RefObject, useEffect, useRef, useState } from 'react'
import {
  findNodeHandle,
  NativeSyntheticEvent,
  requireNativeComponent,
  StyleSheet,
  UIManager,
} from 'react-native'

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
type NativeSeedPhraseInputRef = typeof NativeSeedPhraseInput & { handleSubmit: () => void }

const styles = StyleSheet.create({
  input: {
    flex: 1,
    flexGrow: 1,
  },
})

export const useSeedPhraseInputRef = (): RefObject<NativeSeedPhraseInputRef> => {
  const ref = useRef<NativeSeedPhraseInputRef>(null)
  const current = ref.current

  useEffect(() => {
    if (current) {
      current.handleSubmit = (): void => {
        // Executes in Native as an external method in iOS (RCT_EXTERN_METHOD) or a command in Android
        UIManager.dispatchViewManagerCommand(findNodeHandle(current), 'handleSubmit', [])
      }
    }
  }, [current])

  return ref
}

export const SeedPhraseInput = forwardRef<NativeSeedPhraseInputRef, NativeSeedPhraseInputProps>(
  (props, ref) => {
    const [height, setHeight] = useState(0)

    return (
      <NativeSeedPhraseInput
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ref={ref}
        style={[styles.input, { height }]}
        {...props}
        onHeightMeasured={(e) => {
          // Round to limit state updates (was called with nearly the same value multiple times)
          setHeight(Math.round(e.nativeEvent.height))
        }}
      />
    )
  }
)
SeedPhraseInput.displayName = 'NativeSeedPhraseInput'
