import { memo } from 'react'
import { Flex, Text } from 'ui/src'
import { useTranslation } from 'uniswap/src/i18n'

function _NewTag(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex shrink pt="$spacing2" display="inline-flex">
      <Flex
        shrink
        ml="$spacing6"
        px="$spacing4"
        py="$spacing2"
        backgroundColor="$accent2Hovered"
        borderRadius="$rounded6"
        alignItems="center"
      >
        <Text variant="buttonLabel4" color="$accent1Hovered">
          {t('common.new')}
        </Text>
      </Flex>
    </Flex>
  )
}

export const NewTag = memo(_NewTag)
