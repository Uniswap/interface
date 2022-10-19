import React from 'react'
import { useTranslation } from 'react-i18next'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Flex } from 'src/components/layout/Flex'
import { PriceChart } from 'src/components/PriceChart'
import { usePortfolioBalanceGraphs } from 'src/components/PriceChart/PortfolioModel'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'

export const PortfolioBalanceChart = ({ owner }: { owner: Address }) => {
  const graphs = usePortfolioBalanceGraphs(owner)
  const { t } = useTranslation()

  const error = graphs === null

  if (error) {
    // TODO(MOB-1553): improve portfolio chart error state
    return (
      <Flex centered mx="lg" my="md">
        <Text color="accentFailure" textAlign="center" variant="bodyLarge">
          {t('Could not retrieve historical portfolio balances')}
        </Text>
      </Flex>
    )
  }

  return (
    <PriceChart
      customChartLabel={
        <Flex
          bg="backgroundContainer"
          borderRadius="sm"
          flexDirection="row"
          gap="xxs"
          px="xs"
          py="xxs">
          <NetworkLogo chainId={ChainId.Mainnet} size={16} />
          <Text color="textTertiary" variant="buttonLabelSmall">
            {t('Mainnet balance')}
          </Text>
        </Flex>
      }
      graphs={graphs}
    />
  )
}
