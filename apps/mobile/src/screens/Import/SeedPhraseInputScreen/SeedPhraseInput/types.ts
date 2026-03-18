import { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native'

import { TestIDType } from 'uniswap/src/test/fixtures/testIDs'

export enum StringKey {
  InputPlaceholder = 'inputPlaceholder',
  PasteButton = 'pasteButton',
  ErrorInvalidWord = 'errorInvalidWord',
  ErrorPhraseLength = 'errorPhraseLength',
  ErrorWrongPhrase = 'errorWrongPhrase',
  ErrorInvalidPhrase = 'errorInvalidPhrase',
  ErrorWordIsAddress = 'errorWordIsAddress',
}

type MnemonicStoredEvent = {
  mnemonicId: string
}

type InputValidatedEvent = {
  canSubmit: boolean
}

type HeightMeasuredEvent = {
  height: number
}

export type NativeSeedPhraseInputProps = {
  targetMnemonicId?: string
  testID?: TestIDType
  strings: Record<StringKey, string>
  onInputValidated: (e: NativeSyntheticEvent<InputValidatedEvent>) => void
  onMnemonicStored: (e: NativeSyntheticEvent<MnemonicStoredEvent>) => void
  // Only needed on iOS to determine when paste permission modal is open, which triggers inactive app state
  // And we need to prevent splash screen from appearing
  onPasteStart: () => void
  onPasteEnd: () => void
  onSubmitError: () => void
}

export type NativeSeedPhraseInputInternalProps = NativeSeedPhraseInputProps & {
  onHeightMeasured: (e: NativeSyntheticEvent<HeightMeasuredEvent>) => void
  style: StyleProp<ViewStyle>
}

export type NativeSeedPhraseInputRef = { handleSubmit: () => void; focus: () => void; blur: () => void }
