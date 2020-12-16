import React, { useContext } from 'react'
import { PageWrapper } from '../Pool/styleds'
import { AutoColumn } from '../../components/Column'
import { HideSmall, TYPE } from '../../theme'
import { Flex, Text } from 'rebass'

import styled, { ThemeContext } from 'styled-components'
import { AutoRowCleanGap, RowBetween, RowFixed } from '../../components/Row'
import { ButtonPrimary, ButtonWithLink } from '../../components/Button'
import { useTranslation } from 'react-i18next'
import { LightCard } from '../../components/Card'

import { Info } from 'react-feather'
import SearchInputWithIcon from '../../components/SearchModal/styleds'

const ButtonRow = styled(RowFixed)`
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: row-reverse;
    justify-content: space-between;
  `};
`

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const ItemCard = styled(LightCard)`
  width: 154px;
`

export default function Governance() {
  const { t } = useTranslation()
  const theme = useContext(ThemeContext)
  return (
    <PageWrapper>
      <AutoColumn gap="lg" justify="center">
        <AutoColumn gap="lg" style={{ width: '100%' }}>
          <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
            <HideSmall>
              <TYPE.mediumHeader lineHeight="24px">{t('governance')}</TYPE.mediumHeader>
            </HideSmall>
            <ButtonRow>
              <SearchInputWithIcon fontSize="12px" fontWeight={700} width="104px" height="32px" />
              <ButtonPrimary id="create-proposal-button" padding="8px 14px">
                <Text fontWeight={700} fontSize={12}>
                  CREATE PROPOSAL
                </Text>
              </ButtonPrimary>
            </ButtonRow>
          </TitleRow>
        </AutoColumn>
        <AutoRowCleanGap gap={8}>
          <ItemCard>Milansssss</ItemCard>
          <ItemCard>Milan</ItemCard>
          <ItemCard>Milan</ItemCard>
          <ItemCard>Milan</ItemCard>
          <ItemCard>Milan</ItemCard>
        </AutoRowCleanGap>
        <ButtonWithLink link={'swapr.eth'} text={'GOVERNANCE STATISTICS'} />
        <LightCard style={{ marginTop: '32px' }}>
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
