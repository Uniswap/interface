import React from 'react'
import { PageWrapper } from '../Pool/styleds'
import { AutoColumn } from '../../components/Column'
import { HideSmall, TYPE } from '../../theme'
import { Flex, Text } from 'rebass'

import styled from 'styled-components'
import { RowBetween, RowFixed } from '../../components/Row'
import { ButtonPrimary, ButtonWithLink } from '../../components/Button'
import { useTranslation } from 'react-i18next'
import { SearchInput } from '../../components/SearchModal/styleds'
import { LightCard } from '../../components/Card'
import { CardSection } from '../../components/earn/styled'
import { Info } from 'react-feather'
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

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`
const SearchInputStyled = styled(SearchInput)`
  height:32px;
  width:104px;
  
  // ${({ theme }) => theme.mediaWidth.upToSmall`
  //   width: 48%;
  // `};

`
const StyledAutoRow = styled.div<{ gap?: number }>`
  display: inline-flex;
  flex-wrap: wrap;
  gap: ${({ gap }) => `${gap}px`};
  justify-content: space-evenly;
`
const ItemCard = styled(LightCard)`
  //width: 24%;

  width: 154px;

  //height: 96px;
  //width: 22%;
`

const VoteCard = styled.div`
  overflow: hidden;
  background-color: ${({ theme }) => theme.bg1};
  border: 1px solid ${({ theme }) => theme.bg2};
  border-radius: 8px;
`
export default function Governance() {
  const { t } = useTranslation()
  return (
    <PageWrapper>
      <AutoColumn gap="lg" justify="center">
        <AutoColumn gap="lg" style={{ width: '100%' }}>
          <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
            <HideSmall>
              <TYPE.mediumHeader lineHeight="24px">{t('governance')}</TYPE.mediumHeader>
            </HideSmall>
            <ButtonRow>
              <SearchInputStyled />

              <ResponsiveButtonPrimary id="create-proposal-button" padding="8px 14px">
                <Text fontWeight={700} fontSize={12}>
                  CREATE PROPOSAL
                </Text>
              </ResponsiveButtonPrimary>
            </ButtonRow>
          </TitleRow>
        </AutoColumn>
        <StyledAutoRow gap={8}>
          <ItemCard>Milansssss</ItemCard>
          <ItemCard>Milan</ItemCard>
          <ItemCard>Milan</ItemCard>
          <ItemCard>Milan</ItemCard>
          <ItemCard>Milan</ItemCard>
        </StyledAutoRow>
        <ButtonWithLink link={'swapr.eth'} text={'GOVERNANCE STATISTICS'} />
        <VoteCard style={{ marginTop: '32px' }}>
          <CardSection>
            <AutoColumn gap="md">
              <Flex>
                <Info size={18} />
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
          </CardSection>
        </VoteCard>
      </AutoColumn>
    </PageWrapper>
  )
}
