import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import AggregatedDistributionList from '../../components/LiquidityMining/AggregatedDistributionsList'
import { TYPE } from '../../theme'
import { PageWrapper, ResponsiveButtonPrimary, TitleRow } from './styleds'

export default function LiquidityMining() {
  const { t } = useTranslation()

  return (
    <PageWrapper gap="32px">
      <TitleRow>
        <TYPE.mediumHeader lineHeight="24px">{t('liquidityMining.title')}</TYPE.mediumHeader>
        <ResponsiveButtonPrimary as={Link} padding="8px 14px" to="/liquidity-mining/create">
          <Text fontWeight={700} fontSize={12}>
            {t('liquidityMining.action.create')}
          </Text>
        </ResponsiveButtonPrimary>
      </TitleRow>
      <AggregatedDistributionList />
    </PageWrapper>
  )
}
