import React, { ComponentProps, useCallback, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, NativeSyntheticEvent, TextLayoutEventData } from 'react-native'
import Markdown, { MarkdownProps } from 'react-native-markdown-display'
import { openUri } from 'src/utils/linking'
import { Flex, SpaceTokens, Text, useSporeColors } from 'ui/src'
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
    color = colors.neutral1.val,
    linkColor = colors.neutral2.val,
    readMoreOrLessColor = colors.neutral2.val,
    renderAsMarkdown = false,
    codeBackgroundColor = colors.surface3.val,
    variant = 'body2',
    ...rest
  } = props

  const [expanded, toggleExpanded] = useReducer(
    (isExpanded) => !isExpanded,
    renderAsMarkdown ? true : false
  )
  const [textLengthExceedsLimit, setTextLengthExceedsLimit] = useState(false)
  const [initialContentHeight, setInitialContentHeight] = useState<number | undefined>(undefined)
  const [textLineHeight, setTextLineHeight] = useState<number>(fonts[variant].lineHeight)
  const maxVisibleHeight = textLineHeight * initialDisplayedLines

  const onMarkdownLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!renderAsMarkdown || initialContentHeight !== undefined) return
      const textContentHeight = event.nativeEvent.layout.height
      const currentLines = Math.floor(textContentHeight / textLineHeight)
      setTextLengthExceedsLimit(currentLines > initialDisplayedLines)
      toggleExpanded()
      setInitialContentHeight(textContentHeight)
    },
    [initialContentHeight, initialDisplayedLines, textLineHeight, renderAsMarkdown]
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
      height: !textLengthExceedsLimit || expanded ? 'auto' : maxVisibleHeight,
    },
    code_inline: codeStyle,
    fence: codeStyle,
    code_block: codeStyle,
    link: { color: linkColor },
    paragraph: {
      marginBottom: 0,
      marginTop: 0,
      fontSize: fonts.body2.fontSize,
      lineHeight: textLineHeight,
    },
  }

  return (
    <Flex gap={gap}>
      {renderAsMarkdown ? (
        <Flex onLayout={onMarkdownLayout}>
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
              setTextLineHeight(height)
            }}>
            <Markdown
              style={{
                ...markdownStyle,
                body: { ...markdownStyle.body, height: 'auto' },
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
        </Flex>
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
