import React, { ComponentProps, useCallback, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, NativeSyntheticEvent, TextLayoutEventData } from 'react-native'
import Markdown, { MarkdownProps } from 'react-native-markdown-display'
import {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import { openUri } from 'src/utils/linking'
import { AnimatedFlex, Flex, SpaceTokens, Text, useSporeColors } from 'ui/src'
import { fonts } from 'ui/src/theme'

type LongTextProps = {
  initialDisplayedLines?: number
  text: string
  gap?: SpaceTokens
  color?: string
  linkColor?: string
  codeBackgroundColor?: string
  readMoreOrLessColor?: string
  renderAsMarkdown?: boolean
  variant?: keyof typeof fonts
} & Omit<
  ComponentProps<typeof Text>,
  'children' | 'numberOfLines' | 'onTextLayout' | 'color' | 'variant'
>

export function LongText(props: LongTextProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const {
    initialDisplayedLines = 3,
    text,
    gap = '$spacing8',
    color = colors.neutral1.get(),
    linkColor = colors.neutral2.get(),
    readMoreOrLessColor = colors.neutral2.get(),
    renderAsMarkdown = false,
    codeBackgroundColor = colors.surface3.get(),
    variant = 'body2',
    ...rest
  } = props

  const [expanded, toggleExpanded] = useReducer(
    (isExpanded) => !isExpanded,
    renderAsMarkdown ? true : false
  )
  const [textLengthExceedsLimit, setTextLengthExceedsLimit] = useState(false)

  const initialContentHeight = useSharedValue<number | undefined>(undefined)
  const textLineHeight = useSharedValue(0)
  const maxVisibleHeight = useDerivedValue(
    () => textLineHeight.value * initialDisplayedLines,
    [initialDisplayedLines]
  )
  const animatedStyle = useAnimatedStyle(
    () => ({
      height: !textLengthExceedsLimit || expanded ? 'auto' : maxVisibleHeight.value,
      overflow: 'hidden',
    }),
    [expanded, textLengthExceedsLimit]
  )

  useAnimatedReaction(
    () => ({
      initialHeight: initialContentHeight.value,
      lineHeight: textLineHeight.value,
    }),
    ({ initialHeight, lineHeight }) => {
      if (initialHeight === undefined) return false
      const numberOfLines = Math.floor(initialHeight / lineHeight)
      runOnJS(setTextLengthExceedsLimit)(numberOfLines >= initialDisplayedLines)
    }
  )

  const onMarkdownLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (initialContentHeight.value !== undefined) return
      initialContentHeight.value = event.nativeEvent.layout.height
      toggleExpanded()
    },
    [initialContentHeight]
  )

  const onTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      setTextLengthExceedsLimit(e.nativeEvent.lines.length >= initialDisplayedLines)
    },
    [initialDisplayedLines]
  )

  const codeStyle = { backgroundColor: codeBackgroundColor, borderColor: 'transparent' }

  const markdownStyle: MarkdownProps['style'] = {
    body: {
      color,
      fontFamily: fonts[variant].family,
      overflow: 'hidden',
    },
    code_inline: codeStyle,
    fence: codeStyle,
    code_block: codeStyle,
    link: { color: linkColor },
    paragraph: {
      marginBottom: 0,
      marginTop: 0,
      fontSize: fonts[variant].fontSize,
      lineHeight: fonts[variant].lineHeight,
    },
  }

  return (
    <Flex gap={gap}>
      {renderAsMarkdown ? (
        <AnimatedFlex style={animatedStyle} onLayout={onMarkdownLayout}>
          {/* Render fake one-line markdown to properly measure the height of a single text line */}
          <Flex
            opacity={0}
            pointerEvents="none"
            position="absolute"
            onLayout={({
              nativeEvent: {
                layout: { height },
              },
            }): void => {
              textLineHeight.value = height
            }}>
            <Markdown
              style={{
                ...markdownStyle,
                body: {},
                paragraph: { ...markdownStyle.paragraph, lineHeight: fonts[variant].lineHeight },
              }}
              {...{ children: '.' }}
            />
          </Flex>
          <Markdown
            style={markdownStyle}
            onLinkPress={(url): false => {
              // add our own custom link handler since it has security checks that only open http/https links
              openUri(url).catch(() => undefined)
              return false
            }}
            // HACK: children prop no in TS definition
            {...{ children: text }}
          />
        </AnimatedFlex>
      ) : (
        <Text
          numberOfLines={expanded ? undefined : initialDisplayedLines}
          style={{ color }}
          variant={variant}
          onTextLayout={onTextLayout}
          {...rest}>
          {text}
        </Text>
      )}

      {/* Text is removed vs hidden using opacity to ensure spacing after the element is consistent in all cases.
      This will cause mild thrash as data loads into a page but will ensure consistent spacing */}
      {textLengthExceedsLimit ? (
        <Text
          my="$none"
          py="$none"
          style={{ color: readMoreOrLessColor }}
          testID="read-more-button"
          variant="buttonLabel3"
          onPress={toggleExpanded}>
          {expanded ? t('Read less') : t('Read more')}
        </Text>
      ) : null}
    </Flex>
  )
}
