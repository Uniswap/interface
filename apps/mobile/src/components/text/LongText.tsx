import React, { ComponentProps, useCallback, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, NativeSyntheticEvent, TextLayoutEventData } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { Text } from 'src/components/Text'
import { openUri } from 'src/utils/linking'
import { Flex, SpaceTokens, useSporeColors } from 'ui/src'
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
    variant = 'bodySmall',
    ...rest
  } = props

  const [expanded, toggleExpanded] = useReducer(
    (isExpanded) => !isExpanded,
    renderAsMarkdown ? true : false
  )
  const [textLengthExceedsLimit, setTextLengthExceedsLimit] = useState(false)
  const [initialContentHeight, setInitialContentHeight] = useState<number | undefined>(undefined)

  const textLineHeight = fonts[variant].lineHeight
  const maxVisibleHeight = textLineHeight * initialDisplayedLines

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!renderAsMarkdown || initialContentHeight !== undefined) return
      const textContentHeight = event.nativeEvent.layout.height
      setTextLengthExceedsLimit(textContentHeight > maxVisibleHeight)
      toggleExpanded()
      setInitialContentHeight(textContentHeight)
    },
    [initialContentHeight, maxVisibleHeight, renderAsMarkdown]
  )

  const onTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      setTextLengthExceedsLimit(e.nativeEvent.lines.length >= initialDisplayedLines)
    },
    [initialDisplayedLines]
  )

  const codeStyle = useMemo(
    () => ({ backgroundColor: codeBackgroundColor, borderColor: 'transparent' }),
    [codeBackgroundColor]
  )

  return (
    <Flex gap={gap}>
      <Flex gap="$none" onLayout={onLayout}>
        {renderAsMarkdown ? (
          <Markdown
            style={{
              body: {
                color,
                height: !textLengthExceedsLimit || expanded ? 'auto' : maxVisibleHeight,
                overflow: 'hidden',
              },
              code_inline: codeStyle,
              fence: codeStyle,
              code_block: codeStyle,
              link: { color: linkColor },
              paragraph: {
                marginBottom: 0,
                marginTop: 0,
                fontSize: fonts.bodySmall.fontSize,
                lineHeight: fonts.bodySmall.lineHeight,
              },
            }}
            onLinkPress={(url): false => {
              // add our own custom link handler since it has security checks that only open http/https links
              openUri(url).catch(() => undefined)
              return false
            }}
            // HACK: children prop no in TS definition
            {...{ children: text }}
          />
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
      </Flex>

      {/* Text is removed vs hidden using opacity to ensure spacing after the element is consistent in all cases.
      This will cause mild thrash as data loads into a page but will ensure consistent spacing */}
      {textLengthExceedsLimit ? (
        <Text
          my="none"
          py="none"
          style={{ color: readMoreOrLessColor }}
          testID="read-more-button"
          variant="buttonLabelSmall"
          onPress={toggleExpanded}>
          {expanded ? t('Read less') : t('Read more')}
        </Text>
      ) : null}
    </Flex>
  )
}
