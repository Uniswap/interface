import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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
