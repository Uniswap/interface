/**
 * The `ElementAfterText` compat prop contract (INFRA-3601): the legacy ui
 * component's full prop surface — a closed four-prop
 * interface with no rest spread. `wrapperProps` and `textProps` are typed
 * against the compat Flex/Text surfaces the component renders with, which
 * carry the legacy prop vocabulary.
 */
import type * as React from 'react'
import type { FlexCompatProps } from '../flex-compat/props'
import type { TextCompatProps } from '../text-compat/props'

export interface ElementAfterTextProps {
  /** Rendered after the last word of `text` (badge, tag, icon). */
  element?: React.JSX.Element
  text: string
  /** Props for the wrapping Flex row. */
  wrapperProps?: FlexCompatProps
  /** Props for the Text; defaults match legacy (neutral1, body2). */
  textProps?: TextCompatProps
}
