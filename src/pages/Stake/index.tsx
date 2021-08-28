import { AutoColumn } from '../../components/Column'
import styled from 'styled-components/macro'
import { TYPE } from '../../theme'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { CardSection, DataCard, CardBGImage, OverviewGrid } from '../../components/earn/styled'
import { DarkCard } from '../../components/Card'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { GenericBadge } from 'components/Badge'
import { Zap } from 'react-feather'
import { useAllIncentivesByPool } from '../../hooks/incentives/useAllIncentives'
import ProgramCard from '../../components/earn/ProgramCard'
import Loader from 'components/Loader'
import { ButtonGreySmall } from 'components/Button'

const PageWrapper = styled(AutoColumn)`
  max-width: 840px;
  width: 100%;
`

const TopSection = styled(AutoColumn)`
  width: 100%;
`

const ProgramSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 10px;
  row-gap: 12px;
  width: 100%;
  justify-self: center;
`

export default function Stake() {
  const theme = useTheme()

  const { loading, incentives } = useAllIncentivesByPool()

  return (
    <PageWrapper gap="lg" justify="center">
      <TopSection gap="md">
        <RowBetween>
          <TYPE.body style={{ marginTop: '0.5rem' }} fontSize="20px" color={theme.text3}>
            <Trans>Boosted Pools</Trans>
          </TYPE.body>
          <AutoRow gap="6px" width="fit-content">
            <ButtonGreySmall>Find Program</ButtonGreySmall>
            <ButtonGreySmall>New Program</ButtonGreySmall>
          </AutoRow>
        </RowBetween>
        <DataCard>
          <CardSection>
            <AutoColumn gap="md">
              <GenericBadge style={{ backgroundColor: theme.blue4 }}>
                <RowFixed>
                  <Zap stroke={theme.blue3} size="16px" strokeWidth={'3px'} />
                  <TYPE.body fontWeight={700} fontSize="12px" color={theme.blue3} ml="4px">
                    Liquidity Mining
                  </TYPE.body>
                </RowFixed>
              </GenericBadge>
              <TYPE.body fontWeight={600} fontSize="24px" color={theme.blue3}>
                <Trans>Earn more with boosts</Trans>
              </TYPE.body>
              <TYPE.body color={theme.blue3}>
                <Trans>Learn about boosted rewards on your liquidity positions ➞</Trans>
              </TYPE.body>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
        </DataCard>
      </TopSection>
      <DarkCard padding="24px">
        <AutoColumn gap="16px">
          <OverviewGrid style={{ padding: '0' }}>
            <TYPE.body justifySelf="flex-start" fontSize="14px">
              <Trans>Active Programs</Trans>
            </TYPE.body>
            <TYPE.body fontSize="14px" style={{ whiteSpace: 'nowrap' }}>
              <Trans>7D Active Liquidity</Trans>
            </TYPE.body>
            <TYPE.body fontSize="14px">
              <Trans>Rewards Rate</Trans>
            </TYPE.body>
          </OverviewGrid>
          <ProgramSection>
            {loading ? (
              <Loader />
            ) : !incentives ? (
              <TYPE.body>
                <Trans>Error loading program</Trans>{' '}
              </TYPE.body>
            ) : (
              Object.keys(incentives).map((poolAddress) => (
                <ProgramCard
                  key={poolAddress + '-program-overview'}
                  poolAddress={poolAddress}
                  incentives={incentives[poolAddress]}
                />
              ))
            )}
          </ProgramSection>
        </AutoColumn>
      </DarkCard>
    </PageWrapper>
  )
}
