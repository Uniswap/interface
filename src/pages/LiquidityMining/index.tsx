import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import AggregatedDistributionList from '../../components/LiquidityMining/AggregatedDistributionsList'
import { TYPE } from '../../theme'
import { PageWrapper, ResponsiveButtonPrimary } from './styleds'

export default function LiquidityMining() {
  const { t } = useTranslation()

  return (
    <PageWrapper gap="32px">
      <Flex justifyContent="space-between">
        <Box>
          <TYPE.mediumHeader lineHeight="24px">{t('liquidityMining.title')}</TYPE.mediumHeader>
        </Box>
        <Box>
          <ResponsiveButtonPrimary as={Link} padding="8px 14px" to="/liquidity-mining/create">
            <Text fontWeight={700} fontSize={12}>
              {t('liquidityMining.action.create')}
            </Text>
          </ResponsiveButtonPrimary>
        </Box>
      </Flex>
      <AggregatedDistributionList />
    </PageWrapper>
  )
}
