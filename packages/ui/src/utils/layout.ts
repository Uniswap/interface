import { useState } from 'react'
import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native'

type ElementPositionProps = {
  position: 'absolute'
  left: number
  top: number
}

/**
 *
 * @returns props that absolutely position an element right after the last word of the last line of text
 * For this to work you must pass in <Text onTextLayout={onTextLayout} /> into the text that you want it to be positioned next to
 */
export function usePostTextElementPositionProps(): {
  postTextElementPositionProps?: ElementPositionProps
  onTextLayout: (event: NativeSyntheticEvent<TextLayoutEventData>) => void
} {
  const [postTextElementPositionProps, setPostTextElementPositionProps] = useState<ElementPositionProps | undefined>(
    undefined,
  )

  const onTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>): void => {
    const { lines } = event.nativeEvent
    const lastLine = lines[lines.length - 1]
    if (!lastLine) {
      return
    }

    const { width, x, y } = lastLine
    setPostTextElementPositionProps({ position: 'absolute', left: x + width, top: y })
  }

  return { postTextElementPositionProps, onTextLayout }
}
