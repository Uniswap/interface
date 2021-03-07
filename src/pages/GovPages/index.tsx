import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'

import { TYPE } from '../../theme'
import { PageWrapper } from '../Pool/styleds'

import { LightCard } from '../../components/Card'
import { RowBetween } from '../../components/Row'
import { AutoColumn } from '../../components/Column'
import CurrencyLogo from '../../components/CurrencyLogo'
import SearchInputWithIcon from '../../components/SearchModal/styleds'
import { useRouter } from '../../hooks/useRouter'
import { ButtonPrimary, ButtonWithLink } from '../../components/Button'

import Container from './Container'
import { MainPage, PairPage } from './constant'
import { useNativeCurrency } from '../../hooks/useNativeCurrency'

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
  const router = useRouter()
  const nativeCurrency = useNativeCurrency()

  return (
    <PageWrapper>
      <AutoColumn gap="lg" justify="center">
        <AutoColumn gap="lg" style={{ width: '100%' }}>
          <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
            {router.query.asset === undefined ? (
              <TYPE.mediumHeader lineHeight="24px">{t('governance')}</TYPE.mediumHeader>
            ) : (
              <>
                <TYPE.mediumHeader color={theme.text4} lineHeight="24px">
                  {t('governance')}
                </TYPE.mediumHeader>
                &nbsp; / &nbsp;
                <CurrencyLogo size="20px" currency={nativeCurrency} />
                &nbsp;
                <TYPE.mediumHeader lineHeight="24px">{t(router.query?.asset)}</TYPE.mediumHeader>
              </>
            )}
            <StyledSearchInput fontSize="12px" fontWeight={700} width="104px" height="32px" />
            <ResponsiveButtonPrimary id="create-proposal-button" padding="8px 14px">
              <Text fontWeight={700} fontSize={12}>
                CREATE PROPOSAL
              </Text>
            </ResponsiveButtonPrimary>
          </TitleRow>
        </AutoColumn>
        <Container
          currentPage={router.query.asset === undefined ? MainPage : PairPage}
          currency={router.location.state?.currency}
        />
        {/** need to pass all informations to container like pairs, currencies etc  */}
        {router.query.asset === undefined && (
          <ButtonWithLink link={'https://swapr.eth.link'} text={'GOVERNANCE STATISTICS'} />
        )}
        <LightCard>
          <AutoColumn gap="md">
            <Flex>
              <Info color={theme.text4} size={18} />
              <TYPE.body marginLeft="10px" color={theme.text4} fontWeight={500} lineHeight="20px">
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
                color={theme.text4}
                fontSize="17px"
                lineHeight="17px"
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
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
