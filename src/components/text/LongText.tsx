import React, { ComponentProps, useCallback, useReducer, useState } from 'react'
import { NativeSyntheticEvent, TextLayoutEventData } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { useAppTheme } from 'src/app/hooks'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

type LongTextProps = {
  initialDisplayedLines?: number
  text: string
  gap?: keyof Theme['spacing']
  color?: keyof Theme['colors']
  linkColor?: keyof Theme['colors']
  renderAsMarkdown?: boolean
} & Omit<ComponentProps<typeof Text>, 'children' | 'numberOfLines' | 'onTextLayout' | 'color'>

export function LongText({
  initialDisplayedLines = 3,
  text,
  gap = 'xs',
  color = 'textPrimary',
  linkColor = 'accentAction',
  renderAsMarkdown = false,
  ...rest
}: LongTextProps) {
  const theme = useAppTheme()
  const [maximized, toggleMaximized] = useReducer((isMaximized) => !isMaximized, false)
  const [textLengthExceedsLimit, setTextLengthExceedsLimit] = useState(false)

  const onTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      setTextLengthExceedsLimit(e.nativeEvent.lines.length >= initialDisplayedLines)
    },
    [initialDisplayedLines]
  )

  return (
    <Flex gap={gap}>
      <Text
        color={color}
        numberOfLines={maximized ? undefined : initialDisplayedLines}
        onTextLayout={onTextLayout}
        {...rest}>
        {renderAsMarkdown ? (
          <Markdown
            style={{
              body: { color: theme.colors[color] },
              link: { color: theme.colors[linkColor] },
            }}>
            {text}
          </Markdown>
        ) : (
          text
        )}
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
