import { Trans, t } from '@lingui/macro'
import { darken } from 'polished'
import React from 'react'
import { ArrowLeft, Trash } from 'react-feather'
import { NavLink, useHistory } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import { ButtonEmpty } from 'components/Button'
import { ShareButtonWithModal } from 'components/ShareModal'
import TransactionSettings from 'components/TransactionSettings'
import Tutorial, { TutorialType } from 'components/Tutorial'
import useTheme from 'hooks/useTheme'

import QuestionHelper from '../QuestionHelper'
import { RowBetween } from '../Row'

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  border-radius: 3rem;
  justify-content: space-evenly;
`

const Wrapper = styled(RowBetween)`
  padding: 1rem 0 4px;

  @media only screen and (min-width: 768px) {
    padding: 1rem 0;
  }
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  height: 3rem;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text3};
  font-size: 20px;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.text};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text)};
  }
`

const ActiveText = styled.div`
  font-weight: 500;
  font-size: 20px;
`

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${({ theme }) => theme.text};
`

const ButtonBack = styled(ButtonEmpty)`
  width: 36px;
  height: 36px;
  justify-content: center;
  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.buttonBlack};
  }
`

const StyledMenuButton = styled.button<{ active?: boolean }>`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 36px;
  width: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }) => theme.subText};

  border-radius: 999px;

  :hover {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.buttonBlack};
  }

  ${({ active }) =>
    active
      ? css`
          cursor: pointer;
          outline: none;
          background-color: ${({ theme }) => theme.buttonBlack};
        `
      : ''}
`

export function SwapPoolTabs({ active }: { active: 'swap' | 'pool' }) {
  return (
    <Tabs style={{ marginBottom: '20px', display: 'none' }}>
      <StyledNavLink id={`swap-nav-link`} to={'/swap'} isActive={() => active === 'swap'}>
        <Trans>Swap</Trans>
      </StyledNavLink>
      <StyledNavLink id={`pool-nav-link`} to={'/pool'} isActive={() => active === 'pool'}>
        <Trans>Pool</Trans>
      </StyledNavLink>
    </Tabs>
  )
}

export function FindPoolTabs() {
  const history = useHistory()

  const goBack = () => {
    history.goBack()
  }

  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem' }}>
        <ButtonEmpty width="fit-content" padding="0" onClick={goBack}>
          <StyledArrowLeft />
        </ButtonEmpty>
        <ActiveText>
          <Trans>Import Pool</Trans>
        </ActiveText>
        <QuestionHelper text={t`Use this tool to find pairs that don't automatically appear in the interface`} />
      </RowBetween>
    </Tabs>
  )
}

export enum LiquidityAction {
  CREATE,
  ADD,
  INCREASE,
  REMOVE,
}

export function AddRemoveTabs({
  action,
  showTooltip = true,
  hideShare = false,
  onShared,
  onCleared,
  onBack,
  tooltip,
  tutorialType,
}: {
  action: LiquidityAction
  showTooltip?: boolean
  hideShare?: boolean
  onShared?: () => void
  onCleared?: () => void
  onBack?: () => void
  tooltip?: string
  tutorialType?: TutorialType
}) {
  const history = useHistory()
  const below768 = useMedia('(max-width: 768px)')
  const goBack = () => {
    history.goBack()
  }

  const theme = useTheme()
  const arrow = (
    <ButtonBack width="fit-content" padding="0" onClick={!!onBack ? onBack : goBack}>
      <StyledArrowLeft />
    </ButtonBack>
  )
  const title = (
    <Flex>
      <ActiveText>
        {action === LiquidityAction.CREATE
          ? t`Create a new pool`
          : action === LiquidityAction.ADD
          ? t`Add Liquidity`
          : action === LiquidityAction.INCREASE
          ? t`Increase Liquidity`
          : t`Remove Liquidity`}
      </ActiveText>
      {showTooltip && (
        <QuestionHelper
          size={16}
          text={
            tooltip ||
            (action === LiquidityAction.CREATE
              ? t`Create a new liquidity pool and earn fees on trades for this token pair`
              : action === LiquidityAction.ADD
              ? t`Add liquidity for a token pair and earn fees on the trades that are in your selected price range`
              : action === LiquidityAction.INCREASE
              ? t``
              : action === LiquidityAction.REMOVE
              ? t`Removing pool tokens converts your position back into underlying tokens at the current rate, proportional to your share of the pool. Accrued fees are included in the amounts you receive`
              : t``)
          }
        />
      )}
    </Flex>
  )
  return (
    <Tabs>
      <Wrapper>
        {below768 && (
          <Flex alignItems={'center'}>
            {arrow}
            {title}
          </Flex>
        )}
        {!below768 && arrow}
        {!below768 && title}
        <Flex style={{ gap: '0px' }}>
          {tutorialType && (
            <Tutorial
              type={tutorialType}
              customIcon={
                <StyledMenuButton>
                  <TutorialIcon />
                </StyledMenuButton>
              }
            />
          )}
          {onCleared && (
            <StyledMenuButton active={false} onClick={onCleared}>
              <Trash size={18} />
            </StyledMenuButton>
          )}
          <TransactionSettings hoverBg={theme.buttonBlack} />
          {!hideShare && <ShareButtonWithModal onShared={onShared} />}
        </Flex>
      </Wrapper>
    </Tabs>
  )
}

export function MigrateTab() {
  const history = useHistory()

  const goBack = () => {
    history.goBack()
  }

  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem 0' }}>
        <ButtonBack width="fit-content" padding="0" onClick={goBack}>
          <StyledArrowLeft />
        </ButtonBack>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ActiveText>
            <Trans>Migrate Liquidity</Trans>
          </ActiveText>
          <QuestionHelper
            text={t`Converts your liquidity position on Sushiswap into underlying tokens at the current rate. Tokens are deposited into the basic AMP=1 pool on the KyberSwap and you will be given DMM-LP tokens representing your new pool share. If rates are different between the two platforms, some tokens may be refunded to your address.`}
          />
        </div>
        <TransactionSettings />
      </RowBetween>
    </Tabs>
  )
}
