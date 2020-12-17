import React, { useContext } from 'react'
import { PageWrapper } from '../Pool/styleds'
import { AutoColumn } from '../../components/Column'
import { TYPE } from '../../theme'
import { Flex, Text } from 'rebass'

import styled, { ThemeContext } from 'styled-components'
import { AutoRowCleanGap, RowBetween } from '../../components/Row'
import { ButtonPrimary, ButtonWithLink } from '../../components/Button'
import { useTranslation } from 'react-i18next'
import { LightCard } from '../../components/Card'

import { Info } from 'react-feather'
import SearchInputWithIcon from '../../components/SearchModal/styleds'
import { GovernanceCard } from './styles'

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    
  `};
`
const StyledSearchInput = styled(SearchInputWithIcon)`
  margin-left: auto;
  margin-right: 8px;
`
const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

export default function Governance() {
  const { t } = useTranslation()
  const theme = useContext(ThemeContext)
  return (
    <PageWrapper>
      <AutoColumn gap="lg" justify="center">
        <AutoColumn gap="lg" style={{ width: '100%' }}>
          <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
            <TYPE.mediumHeader lineHeight="24px">{t('governance')}</TYPE.mediumHeader>

            <StyledSearchInput fontSize="12px" fontWeight={700} width="104px" height="32px" />
            <ResponsiveButtonPrimary id="create-proposal-button" padding="8px 14px">
              <Text fontWeight={700} fontSize={12}>
                CREATE PROPOSAL
              </Text>
            </ResponsiveButtonPrimary>
          </TitleRow>
        </AutoColumn>
        <AutoRowCleanGap gap={8}>
          <GovernanceCard />
          <GovernanceCard />
          <GovernanceCard />
          <GovernanceCard />
          <GovernanceCard />
          <GovernanceCard />
        </AutoRowCleanGap>
        <ButtonWithLink link={'swapr.eth'} text={'GOVERNANCE STATISTICS'} />
        <LightCard>
          <AutoColumn gap="md">
            <Flex>
              <Info color={theme.text4} size={18} />
              <TYPE.body marginLeft="10px" color={'text4'} fontWeight={500} lineHeight="20px">
                Swapr Governance
              </TYPE.body>
            </Flex>
            <RowBetween>
              <TYPE.body fontWeight="500" fontSize="11px" lineHeight="16px" letterSpacing="-0.4px">
                SWP-LP tokens represent voting shares in Swapr governance. You can vote on each proposal yourself or
                delegate your votes to a third party.
              </TYPE.body>
            </RowBetween>
            <RowBetween>
              <TYPE.body
                as="a"
                color={'text4'}
                fontSize="17px"
                lineHeight="17px"
                style={{ textDecoration: 'underline' }}
              >
                Read more about Swapr Governance
              </TYPE.body>
            </RowBetween>
          </AutoColumn>
        </LightCard>
      </AutoColumn>
    </PageWrapper>
  )
}
