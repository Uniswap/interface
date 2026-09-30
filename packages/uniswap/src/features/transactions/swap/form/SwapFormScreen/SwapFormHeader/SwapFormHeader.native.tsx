import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'

export const SwapFormHeader = (): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Flex
      row
      alignItems="center"
      position="relative"
      justifyContent="flex-start"
      mb="$spacing12"
      mt="$spacing8"
      pl="$spacing12"
      py="$spacing4"
      testID={TestID.SwapFormHeader}
    >
      <Text variant="subheading1">{t('swap.form.header')}</Text>
    </Flex>
  )
}
