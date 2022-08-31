import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout/Flex'
import { PriceChart } from 'src/components/PriceChart'
import { usePortfolioBalanceGraphs } from 'src/components/PriceChart/PortfolioModel'
import { Text } from 'src/components/Text'

export const PortfolioBalanceChart = ({ owner }: { owner: Address }) => {
  const graphs = usePortfolioBalanceGraphs(owner)
  const { t } = useTranslation()

  const error = graphs === null

  if (error) {
    // TODO(MOB-1553): improve portfolio chart error state
    return (
      <Flex centered mx="lg" my="md">
        <Text color="accentFailure" textAlign="center" variant="body">
          {t('Could not retrieve historical portfolio balances')}
        </Text>
      </Flex>
    )
  }

  return <PriceChart graphs={graphs} />
}
