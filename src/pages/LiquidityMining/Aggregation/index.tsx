import React from 'react'
import { TYPE } from '../../../theme'
import { PageWrapper, ResponsiveButtonPrimary, TitleRow } from '../styleds'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, Flex, Text } from 'rebass'
import DistributionsPerAssetList from '../../../components/LiquidityMining/DistributionsPerAssetList'
import CurrencyLogo from '../../../components/CurrencyLogo'
import { useDistributionsFromAggregation } from '../../../hooks/useDistributionsFromAggregation'

export default function LiquidityMiningAggregation({
  match: {
    params: { aggregationId }
  }
}: RouteComponentProps<{ aggregationId: string }>) {
  const { t } = useTranslation()
  const { relatedToken, distributions } = useDistributionsFromAggregation(aggregationId)

  return (
    <PageWrapper gap="32px">
      <TitleRow>
        <Flex justifyContent="space-between">
          <Box mr="6px">
            <Link to="/liquidity-mining">
              <TYPE.mediumHeader color="text4" lineHeight="24px">
                {t('liquidityMining.title')}
              </TYPE.mediumHeader>
            </Link>
          </Box>
          <Box mr="6px">
            <TYPE.mediumHeader color="text4" lineHeight="24px">
              /
            </TYPE.mediumHeader>
          </Box>
          <Box mr="6px">
            <CurrencyLogo currency={relatedToken || undefined} />
          </Box>
          <Box>
            <TYPE.mediumHeader lineHeight="24px">{relatedToken ? relatedToken.symbol : ''}</TYPE.mediumHeader>
          </Box>
        </Flex>
        <ResponsiveButtonPrimary as={Link} padding="8px 14px" to="/liquidity-mining/create">
          <Text fontWeight={700} fontSize={12}>
            {t('liquidityMining.action.create')}
          </Text>
        </ResponsiveButtonPrimary>
      </TitleRow>
      <DistributionsPerAssetList distributions={distributions} />
    </PageWrapper>
  )
}
