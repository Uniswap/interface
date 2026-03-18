/** biome-ignore lint/style/noRestrictedImports: this is the implementation of a wrapper we recommend to use */
import type { BottomSheetTextInput as GorhomBottomSheetTextInput } from '@gorhom/bottom-sheet'
import { ComponentProps } from 'react'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { ModalProps } from 'uniswap/src/components/modals/ModalProps'
import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * Renders as a bottom sheet modal on mobile app/mweb & a dialog modal on desktop web/extension.
 */
export function Modal(_: ModalProps): JSX.Element {
  throw new PlatformSplitStubError('Modal')
}

export function BottomSheetDetachedModal(_: ModalProps): JSX.Element {
  throw new PlatformSplitStubError('BottomSheetDetachedModal')
}

export function BottomSheetTextInput(
  _: ComponentProps<typeof GorhomBottomSheetTextInput | typeof TextInput>,
): JSX.Element {
  throw new PlatformSplitStubError('BottomSheetTextInput')
}
