import { BottomSheetTextInput as GorhomBottomSheetTextInput } from '@gorhom/bottom-sheet'
import { ComponentProps } from 'react'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { BottomSheetModalProps } from 'uniswap/src/components/modals/BottomSheetModalProps'
import { NotImplementedError } from 'utilities/src/errors'

export function BottomSheetModal(_: BottomSheetModalProps): JSX.Element {
  throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
}

export function BottomSheetDetachedModal(_: BottomSheetModalProps): JSX.Element {
  throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
}

export function BottomSheetTextInput(
  _: ComponentProps<typeof GorhomBottomSheetTextInput | typeof TextInput>,
): JSX.Element {
  throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
}
