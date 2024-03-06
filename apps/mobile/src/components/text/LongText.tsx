import React, { ComponentProps, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, TextLayoutEventData } from 'react-native'
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
    readMoreOrLessColor = colors.neutral2.val,
    variant = 'body2',
    ...rest
  } = props

  const [expanded, setExpanded] = useState(true)
  const [textLengthExceedsLimit, setTextLengthExceedsLimit] = useState(false)
  const isInitializedRef = useRef(false)

  const onTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      // Only needs to measure full number of lines once
      if (isInitializedRef.current) {
        return
      }
      setTextLengthExceedsLimit(e.nativeEvent.lines.length > initialDisplayedLines)
      setExpanded(false)
      isInitializedRef.current = true
    },
    [initialDisplayedLines]
  )

  return (
    <Flex gap={gap}>
      <Text
        numberOfLines={expanded ? undefined : initialDisplayedLines}
        style={{ color }}
        variant={variant}
        onTextLayout={onTextLayout}
        {...rest}>
        {text}
      </Text>

      {/* Text is removed vs hidden using opacity to ensure spacing after the element is consistent in all cases.
      This will cause mild thrash as data loads into a page but will ensure consistent spacing */}
      {textLengthExceedsLimit ? (
        <Text
          my="$none"
          py="$none"
          style={{ color: readMoreOrLessColor }}
          testID="read-more-button"
          variant="buttonLabel3"
          onPress={(): void => setExpanded(!expanded)}>
          {expanded ? t('common.longText.button.less') : t('common.longText.button.more')}
        </Text>
      ) : null}
    </Flex>
  )
}
