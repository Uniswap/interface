import { BottomSheetTextInput as GorhomBottomSheetTextInput } from '@gorhom/bottom-sheet'
import { ComponentProps } from 'react'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { ModalProps } from 'uniswap/src/components/modals/ModalProps'
import { NotImplementedError } from 'utilities/src/errors'

/**
 * Renders as a bottom sheet modal on mobile app/mweb & a dialog modal on desktop web/extension.
 */
export function Modal(_: ModalProps): JSX.Element {
  throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
}

export function BottomSheetDetachedModal(_: ModalProps): JSX.Element {
  throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
}

export function BottomSheetTextInput(
  _: ComponentProps<typeof GorhomBottomSheetTextInput | typeof TextInput>,
): JSX.Element {
  throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
}
