import { Flex, Text } from 'ui/src'
import { useTranslation } from 'uniswap/src/i18n'

export default function TopPools() {
  const { t } = useTranslation()
  return (
    <Flex width="100%" pt="$spacing12">
      <Text variant="subheading1">{t('pool.top')}</Text>
    </Flex>
  )
}
