/**
 * Web leg of the `ElementAfterText` compat (INFRA-3601). The legacy ui
 * component had two renderings:
 *
 * - Desktop web (and Android): the element renders inline after the Text in a
 *   centered row.
 * - Everything else: the element is wrapped in a Flex that an
 *   `onTextLayout`-driven hook absolutely positions after the last line of
 *   text. `onTextLayout` is a React Native event that never fires on the DOM,
 *   so on web the position props stay `undefined` forever and the wrapped
 *   element renders inline, unpositioned — that is the legacy web behavior
 *   this leg reproduces, wrapper included, without the dead hook.
 */
import { isWebAppDesktop } from '@universe/environment'
import type * as React from 'react'
import { FlexCompat } from '../flex-compat/FlexCompat'
import { TextCompat } from '../text-compat/TextCompat'
import type { ElementAfterTextProps } from './props'
import { DEFAULT_TEXT_PROPS } from './shared'

export function ElementAfterTextCompat({
  element,
  text,
  wrapperProps,
  textProps,
}: ElementAfterTextProps): React.JSX.Element {
  if (isWebAppDesktop) {
    return (
      <FlexCompat row alignItems="center" {...wrapperProps}>
        <TextCompat {...DEFAULT_TEXT_PROPS} {...textProps}>
          {text}
        </TextCompat>
        {element}
      </FlexCompat>
    )
  }

  return (
    <FlexCompat row alignItems="center" {...wrapperProps}>
      <TextCompat {...DEFAULT_TEXT_PROPS} {...textProps}>
        {text}
      </TextCompat>
      <FlexCompat>{element}</FlexCompat>
    </FlexCompat>
  )
}
