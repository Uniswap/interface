import React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { NavLink, Link as HistoryLink } from 'react-router-dom'

import { ArrowLeft } from 'react-feather'
import { RowBetween } from '../Row'
import QuestionHelper from '../QuestionHelper'

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  border-radius: 3rem;
  justify-content: space-evenly;
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  height: 3rem;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  opacity: 0.5;
  text-decoration: none;
  color: ${({ theme }) => theme.text3};
  font-size: 20px;

  &.${activeClassName} {
    opacity: 1;
    border-radius: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.primary1};
  }
`

const ActiveText = styled.div`
  color: ${({ theme }) => theme.text1};
  font-weight: 500;
  font-size: 20px;
`

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${({ theme }) => theme.text1};
`

const NotificationDot = styled.div`
  width: 8px;
  height: 8px;
  background-color: #f76341;
  border-radius: 50%;
  position: relative;
  top: -0.55em;
  right: -3.1em;
`

export function SwapPoolTabs({ active }: { active: 'swap' | 'pool' | 'boost' | 'apy' }) {
  const { t } = useTranslation()
  return (
    <Tabs style={{ marginBottom: '20px', width: '100%', maxWidth: '350px', marginRight: 'auto', marginLeft: 'auto' }}>
      <StyledNavLink id={`swap-nav-link`} to={'/swap'} isActive={() => active === 'swap'}>
        {t('swap')}
      </StyledNavLink>
      <StyledNavLink id={`pool-nav-link`} to={'/swap-pool'} isActive={() => active === 'pool'}>
        {t('pool')}
      </StyledNavLink>
      <StyledNavLink id={`boost-nav-link`} to={'/swap-boost'} isActive={() => active === 'boost'}>
        <NotificationDot />
        {t('boost')}
      </StyledNavLink>
      <StyledNavLink id={`yield-nav-link`} to={'/swap-apy'} isActive={() => active === 'apy'}>
        {t('apy')}
      </StyledNavLink>
    </Tabs>
  )
}

export function FindPoolTabs() {
  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem' }}>
        <HistoryLink to="/swap-pool">
          <StyledArrowLeft />
        </HistoryLink>
        <ActiveText>Import Pool</ActiveText>
        <QuestionHelper text={"Use this tool to find pairs that don't automatically appear in the interface."} />
      </RowBetween>
    </Tabs>
  )
}

export function AddRemoveTabs({ adding }: { adding: boolean }) {
  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem' }}>
        <HistoryLink to="/swap-pool">
          <StyledArrowLeft />
        </HistoryLink>
        <ActiveText>{adding ? 'Add' : 'Remove'} Liquidity</ActiveText>
        <QuestionHelper
          text={
            adding
              ? 'When you add liquidity, you are given pool tokens representing your position. These tokens automatically earn fees proportional to your share of the pool, and can be redeemed at any time.'
              : 'Removing pool tokens converts your position back into underlying tokens at the current rate, proportional to your share of the pool. Accrued fees are included in the amounts you receive.'
          }
        />
      </RowBetween>
    </Tabs>
  )
}

export function StakeTabs() {
  const { t } = useTranslation()
  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem' }}>
        <HistoryLink to="/swap-boost">
          <StyledArrowLeft />
        </HistoryLink>
        <ActiveText>{t('tabs_title_stake_cro')}</ActiveText>
        <div style={{ marginLeft: 4, width: 16 }} />
      </RowBetween>
    </Tabs>
  )
}
