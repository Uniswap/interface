import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import TickIcon from '../../assets/images/checkmark-green.png'
import { ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import StakeSummary from '../../components/Stake/StakeSummary'
import { CustomTitle } from '../../utils/customTitle'
import AppBody from '../AppBody'

const StyledRocketIcon = styled.div`
  width: 40px;
  height: 53px;
  font-family: AppleColorEmoji;
  font-size: 40px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: ${({ theme }) => theme.primary1};
`

const StyledTitle = styled(Text)`
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: ${({ theme }) => theme.text3};
`

const StyledItemText = styled.span`
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.86;
  letter-spacing: normal;
  color: ${({ theme }) => theme.text3};
  margin-left: 1rem;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-left: 0.5rem;
  `};
`
const BoostTab = () => {
  const { t } = useTranslation()
  const theme = useContext(ThemeContext)

  return (
    <>
      <CustomTitle titleStr={'Farm CRO By Staking | DeFi Swap'}></CustomTitle>
      <AppBody>
        <SwapPoolTabs active={'boost'} />
        <AutoColumn gap="lg" justify="center">
          <StyledRocketIcon>
            <span role="img" aria-label="rocket">
              🚀
            </span>
          </StyledRocketIcon>
          <StyledTitle fontSize="24px" fontWeight={500} lineHeight="42px" marginRight={10}>
            {t('boost_tab_subtitle')}
          </StyledTitle>
        </AutoColumn>

        <br />

        <AutoColumn gap="sm" justify="start">
          <StyledItemText theme={theme}>
            <img src={TickIcon} alt="" /> {t('boost_tab_list_1')}
          </StyledItemText>
          <StyledItemText>
            <img src={TickIcon} alt="" /> {t('boost_tab_list_2')}
          </StyledItemText>
          <StyledItemText>
            <img src={TickIcon} alt="" /> {t('boost_tab_list_3')}
          </StyledItemText>
        </AutoColumn>
        <br />

        <AutoColumn gap="lg" justify="center">
          <ButtonPrimary id="boost-btn-add-stake" as={Link} style={{ padding: 16 }} to="/swap-boost/stake">
            <Text fontWeight={500} fontSize={20}>
              {t('boost_btn_add_stake')}
            </Text>
          </ButtonPrimary>
        </AutoColumn>
        <br />
        <AutoColumn gap="lg">
          <StakeSummary />
        </AutoColumn>
      </AppBody>
    </>
  )
}

export default BoostTab
