import React, { ComponentProps, useCallback, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, NativeSyntheticEvent, TextLayoutEventData } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { useAppTheme } from 'src/app/hooks'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { openUri } from 'src/utils/linking'
import { Theme } from 'ui/src/theme/restyle/theme'

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
  const { t } = useTranslation()
  const {
    initialDisplayedLines = 3,
    text,
    gap = 'spacing8',
    color = theme.colors.neutral1,
    linkColor = theme.colors.accent1,
    readMoreOrLessColor = theme.colors.accent1,
    renderAsMarkdown = false,
    variant = 'bodySmall',
    ...rest
  } = props

  const [expanded, toggleExpanded] = useReducer(
    (isExpanded) => !isExpanded,
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

  return (
    <Flex gap={gap}>
      <Box onLayout={onLayout}>
        {renderAsMarkdown ? (
          <Markdown
            style={{
              body: {
                color,
                height: !textLengthExceedsLimit || expanded ? 'auto' : maxVisibleHeight,
                overflow: 'hidden',
              },
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
      </Box>

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
