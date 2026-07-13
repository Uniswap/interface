import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, FlexProps, Text } from 'ui/src'
import { fonts } from 'ui/src/theme'

interface NewTagProps {
  backgroundColor?: ColorTokens
  textColor?: ColorTokens
  ml?: FlexProps['ml']
  exclamation?: boolean
}

function NewTagInner({
  backgroundColor = '$accent2Hovered',
  textColor = '$accent1Hovered',
  ml = '$spacing6',
  exclamation = false,
}: NewTagProps): JSX.Element {
  const { t } = useTranslation()
  // 100% line box (= the font size); a 1px-larger top padding visually centers the descenderless glyph.
  const lineHeight = fonts.buttonLabel4.fontSize
  return (
    <Flex shrink pt="$spacing2" display="inline-flex">
      <Flex
        shrink
        ml={ml}
        px="$spacing4"
        pt={3}
        pb="$spacing2"
        backgroundColor={backgroundColor}
        borderRadius="$rounded6"
        alignItems="center"
      >
        <Text variant="buttonLabel4" color={textColor} lineHeight={lineHeight}>
          {exclamation ? t('common.new.exclamation') : t('common.new')}
        </Text>
      </Flex>
    </Flex>
  )
}

export const NewTag = memo(NewTagInner)
