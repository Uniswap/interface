/* eslint-disable react-native/no-inline-styles */
import React, { ComponentProps, useCallback, useReducer, useState } from 'react'
import { LayoutChangeEvent, NativeSyntheticEvent, TextLayoutEventData } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { useAppTheme } from 'src/app/hooks'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'
import { openUri } from 'src/utils/linking'

type LongTextProps = {
  initialDisplayedLines?: number
  text: string
  gap?: keyof Theme['spacing']
  color?: string
  linkColor?: string
  readMoreOrLessColor?: string
  renderAsMarkdown?: boolean
  variant?: keyof Theme['textVariants']
} & Omit<
  ComponentProps<typeof Text>,
  'children' | 'numberOfLines' | 'onTextLayout' | 'color' | 'variant'
>

export function LongText(props: LongTextProps): JSX.Element {
  const theme = useAppTheme()
  const {
    initialDisplayedLines = 3,
    text,
    gap = 'spacing8',
    color = theme.colors.textPrimary,
    linkColor = theme.colors.accentAction,
    readMoreOrLessColor = theme.colors.accentAction,
    renderAsMarkdown = false,
    variant = 'bodySmall',
    ...rest
  } = props
  const [maximized, toggleMaximized] = useReducer(
    (isMaximized) => !isMaximized,
    renderAsMarkdown ? true : false
  )
  const [textLengthExceedsLimit, setTextLengthExceedsLimit] = useState(false)
  const [initialContentHeight, setInitialContentHeight] = useState<number | undefined>(undefined)

  const textLineHeight = theme.textVariants[variant].lineHeight
  const maxVisibleHeight = textLineHeight * initialDisplayedLines

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!renderAsMarkdown || initialContentHeight !== undefined) return
      const textContentHeight = event.nativeEvent.layout.height
      setTextLengthExceedsLimit(textContentHeight > maxVisibleHeight)
      toggleMaximized()
      setInitialContentHeight(textContentHeight)
    },
    [initialContentHeight, maxVisibleHeight, renderAsMarkdown]
  )

  const onTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      if (!renderAsMarkdown) {
        setTextLengthExceedsLimit(e.nativeEvent.lines.length >= initialDisplayedLines)
      }
    },
    [renderAsMarkdown, initialDisplayedLines]
  )

  return (
    <Flex gap={gap}>
      <Text
        numberOfLines={maximized ? undefined : initialDisplayedLines}
        style={
          renderAsMarkdown
            ? {
                color,
                height:
                  !textLengthExceedsLimit || maximized
                    ? 'auto'
                    : maxVisibleHeight - theme.spacing.spacing2,
                overflow: 'hidden',
              }
            : { color }
        }
        variant={variant}
        onLayout={onLayout}
        onTextLayout={onTextLayout}
        {...rest}>
        {renderAsMarkdown ? (
          <Markdown
            style={{
              body: { color },
              link: { color: linkColor },
              paragraph: {
                marginBottom: 0,
                marginTop: 0,
                fontSize: theme.textVariants.bodySmall.fontSize,
                lineHeight: theme.textVariants.bodySmall.lineHeight,
              },
            }}
            onLinkPress={(url): false => {
              // add our own custom link handler since it has security checks that only open http/https links
              openUri(url)
              return false
            }}>
            {text}
          </Markdown>
        ) : (
          text
        )}
      </Text>

      {textLengthExceedsLimit ? (
        <Text
          style={{ color: readMoreOrLessColor }}
          testID="read-more-button"
          variant="buttonLabelSmall"
          onPress={toggleMaximized}>
          {maximized ? 'Read less' : 'Read more'}
        </Text>
      ) : null}
    </Flex>
  )
}
