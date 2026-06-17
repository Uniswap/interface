import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function Change1dUnavailableIndicator(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" gap="$spacing6" testID={TestID.PortfolioChange1dUnavailable}>
      <AlertTriangleFilled color="$neutral3" size="$icon.16" />
      <Text color="$neutral3" variant="body3">
        {t('portfolio.balance.change1dUnavailable')}
      </Text>
    </Flex>
  )
}
