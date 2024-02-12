// eslint-disable-next-line no-restricted-imports
import { BottomSheetTextInput as GorhomBottomSheetTextInput } from '@gorhom/bottom-sheet'
import { ComponentProps, forwardRef } from 'react'
import { NotImplementedError } from 'utilities/src/errors'
import { TextInput } from 'wallet/src/components/input/TextInput'
import {
  BottomSheetModalProps,
  BottomSheetModalRef,
} from 'wallet/src/components/modals/BottomSheetModalProps'

export const BottomSheetModal = forwardRef<BottomSheetModalRef, BottomSheetModalProps>(
  function _BottomSheetModal(_: BottomSheetModalProps): JSX.Element {
    throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
  }
)

export function BottomSheetDetachedModal(_: BottomSheetModalProps): JSX.Element {
  throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
}

export function BottomSheetTextInput(
  _: ComponentProps<typeof GorhomBottomSheetTextInput | typeof TextInput>
): JSX.Element {
  throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
}
