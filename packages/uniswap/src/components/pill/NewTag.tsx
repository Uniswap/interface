import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, FlexProps, Text } from 'ui/src'

interface NewTagProps {
  backgroundColor?: ColorTokens
  textColor?: ColorTokens
  ml?: FlexProps['ml']
  exclamation?: boolean
}

function _NewTag({
  backgroundColor = '$accent2Hovered',
  textColor = '$accent1Hovered',
  ml = '$spacing6',
  exclamation = false,
}: NewTagProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex shrink pt="$spacing2" display="inline-flex">
      <Flex
        shrink
        ml={ml}
        px="$spacing4"
        pb="$spacing2"
        pt={3} // hack to make box look visually more vertically centered with text
        backgroundColor={backgroundColor}
        borderRadius="$rounded6"
        alignItems="center"
      >
        <Text variant="buttonLabel4" color={textColor}>
          {exclamation ? t('common.new.exclamation') : t('common.new')}
        </Text>
      </Flex>
    </Flex>
  )
}

export const NewTag = memo(_NewTag)
