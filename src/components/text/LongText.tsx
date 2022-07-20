import React, { ComponentProps, useCallback, useReducer, useState } from 'react'
import { NativeSyntheticEvent, TextLayoutEventData } from 'react-native'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

type LongTextProps = {
  initialDisplayedLines?: number
  text: string
} & Omit<ComponentProps<typeof Text>, 'children' | 'numberOfLines' | 'onTextLayout'>

export function LongText({ initialDisplayedLines = 3, text, ...rest }: LongTextProps) {
  const [maximized, toggleMaximized] = useReducer((isMaximized) => !isMaximized, false)
  const [textLengthExceedsLimit, setTextLengthExceedsLimit] = useState(false)

  const onTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      setTextLengthExceedsLimit(e.nativeEvent.lines.length >= initialDisplayedLines)
    },
    [initialDisplayedLines]
  )

  return (
    <Flex gap="xs">
      <Text
        numberOfLines={maximized ? undefined : initialDisplayedLines}
        onTextLayout={onTextLayout}
        {...rest}>
        {text}
      </Text>

      {textLengthExceedsLimit ? (
        <Text
          color="textTertiary"
          testID="read-more-button"
          variant={rest.variant}
          onPress={toggleMaximized}>
          {maximized ? 'Read less' : 'Read more'}
        </Text>
      ) : null}
    </Flex>
  )
}
