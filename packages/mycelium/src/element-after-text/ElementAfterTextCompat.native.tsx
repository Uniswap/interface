/**
 * Native leg of the `ElementAfterText` compat (INFRA-3601), reproducing the
 * legacy ui component's device rendering:
 *
 * - Android: the element renders inline after the Text. The legacy comment's
 *   reason carries over — Fabric's `onTextLayout` line metrics are unreliable
 *   on Android and misposition the element.
 * - iOS: the Text reports its line metrics through `onTextLayout`, and the
 *   element is absolutely positioned right after the last word of the last
 *   line. Until the first layout event the element renders inline,
 *   unpositioned, exactly like legacy. While positioned the wrapper reserves
 *   trailing space (the legacy `pr` reservation) so the absolute element does
 *   not overhang the row.
 *
 * The measured coordinates flow through the RN `style` prop rather than the
 * compat left/top props: they are per-render dynamic numbers, and `style` is
 * the compat surface's designated dynamic-value lane on native
 * (FlexCompat.native merges user style last, so it wins).
 */
import { isAndroid } from '@universe/environment'
import type * as React from 'react'
import { useState } from 'react'
import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native'
import { FlexCompat } from '../flex-compat/FlexCompat'
import { TextCompat } from '../text-compat/TextCompat'
import type { ElementAfterTextProps } from './props'
import { DEFAULT_TEXT_PROPS } from './shared'

type ElementPosition = {
  position: 'absolute'
  left: number
  top: number
}

/**
 * The legacy `usePostTextElementPositionProps` hook, ported verbatim:
 * positions an element right after the last word of the last line of the
 * Text that receives `onTextLayout`.
 */
function usePostTextElementPosition(): {
  postTextElementPosition?: ElementPosition
  onTextLayout: (event: NativeSyntheticEvent<TextLayoutEventData>) => void
} {
  const [postTextElementPosition, setPostTextElementPosition] = useState<ElementPosition | undefined>(undefined)

  const onTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>): void => {
    const { lines } = event.nativeEvent
    const lastLine = lines[lines.length - 1]
    if (!lastLine) {
      return
    }

    const { width, x, y } = lastLine
    setPostTextElementPosition({ position: 'absolute', left: x + width, top: y })
  }

  return { postTextElementPosition, onTextLayout }
}

export function ElementAfterTextCompat({
  element,
  text,
  wrapperProps,
  textProps,
}: ElementAfterTextProps): React.JSX.Element {
  const { postTextElementPosition, onTextLayout } = usePostTextElementPosition()

  if (isAndroid) {
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
    <FlexCompat row alignItems="center" pr={postTextElementPosition ? '$spacing24' : undefined} {...wrapperProps}>
      <TextCompat {...DEFAULT_TEXT_PROPS} onTextLayout={onTextLayout} {...textProps}>
        {text}
      </TextCompat>
      {/* FlexCompat types `style` as CSSProperties, so it will not catch web-only values here — keep this object inside the CSS/RN overlap (numeric top/left only). */}
      <FlexCompat style={postTextElementPosition}>{element}</FlexCompat>
    </FlexCompat>
  )
}
