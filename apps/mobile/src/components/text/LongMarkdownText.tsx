import React, { useCallback, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import Markdown, { MarkdownProps } from 'react-native-markdown-display'
import { Flex, SpaceTokens, Text, useSporeColors } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { openUri } from 'wallet/src/utils/linking'

type LongMarkdownTextProps = {
  initialDisplayedLines?: number
  text: string
  gap?: SpaceTokens
  color?: string
  linkColor?: string
  codeBackgroundColor?: string
  readMoreOrLessColor?: string
  variant?: keyof typeof fonts
}

export function LongMarkdownText(props: LongMarkdownTextProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const {
    initialDisplayedLines = 3,
    text,
    gap = '$spacing8',
    color = colors.neutral1.val,
    linkColor = colors.neutral2.val,
    readMoreOrLessColor = colors.neutral2.val,
    codeBackgroundColor = colors.surface3.val,
    variant = 'body2',
  } = props

  const [expanded, toggleExpanded] = useReducer((isExpanded) => !isExpanded, true)
  const [textLengthExceedsLimit, setTextLengthExceedsLimit] = useState(false)
  const [textLineHeight, setTextLineHeight] = useState<number>(fonts[variant].lineHeight)
  const initialContentHeightRef = useRef<number>()
  const maxVisibleHeight = textLineHeight * initialDisplayedLines

  const onMarkdownLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (initialContentHeightRef.current !== undefined) {
        return
      }
      const textContentHeight = event.nativeEvent.layout.height
      const currentLines = Math.floor(textContentHeight / textLineHeight)
      setTextLengthExceedsLimit(currentLines > initialDisplayedLines)
      toggleExpanded()
      initialContentHeightRef.current = textContentHeight
    },
    [initialDisplayedLines, textLineHeight]
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
      <Flex testID="markdown-wrapper" onLayout={onMarkdownLayout}>
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
          {expanded ? t('common.longText.button.less') : t('common.longText.button.more')}
        </Text>
      ) : null}
    </Flex>
  )
}
