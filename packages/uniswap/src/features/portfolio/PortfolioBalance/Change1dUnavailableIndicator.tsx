import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'

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
