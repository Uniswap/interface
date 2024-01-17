import { forwardRef, RefObject, useEffect, useRef } from 'react'
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

export enum StringKey {
  HelpText = 'helpText',
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
  onHelpTextPress: () => void
  onInputValidated: (e: NativeSyntheticEvent<InputValidatedEvent>) => void
  onMnemonicStored: (e: NativeSyntheticEvent<MnemonicStoredEvent>) => void

  // Only needed on iOS to determine when paste permission modal is open, which triggers inactive app state
  // And we need to prevent splash screen from appearing
  onPasteStart: () => void
  onPasteEnd: () => void
}

const NativeSeedPhraseInput = requireNativeComponent<NativeSeedPhraseInputProps>('SeedPhraseInput')
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
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  (props, ref) => <NativeSeedPhraseInput ref={ref} style={styles.input} {...props} />
)
SeedPhraseInput.displayName = 'NativeSeedPhraseInput'
