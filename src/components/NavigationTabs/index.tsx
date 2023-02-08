import { Trans, t } from '@lingui/macro'
import { ArrowLeft, ChevronLeft, Trash } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import { ButtonEmpty } from 'components/Button'
import QuestionHelper from 'components/QuestionHelper'
import { RowBetween } from 'components/Row'
import { ShareButtonWithModal } from 'components/ShareModal'
import TransactionSettings from 'components/TransactionSettings'
import Tutorial, { TutorialType } from 'components/Tutorial'
import useTheme from 'hooks/useTheme'

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

const ActiveText = styled.div`
  font-weight: 500;
  font-size: 20px;
`

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${({ theme }) => theme.text};
`

const ButtonBack = styled(ButtonEmpty)`
  width: 28px;
  height: 28px;
  justify-content: center;
  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.buttonBlack};
  }
  margin-right: 8px;
`

export const StyledMenuButton = styled.button<{ active?: boolean }>`
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

export function FindPoolTabs() {
  const navigate = useNavigate()

  const goBack = () => {
    navigate(-1)
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
  alignTitle = 'center',
  showTooltip = true,
  hideShare = false,
  onShared,
  onCleared,
  onBack,
  tooltip,
  tutorialType,
}: {
  action: LiquidityAction
  alignTitle?: 'center' | 'left'
  showTooltip?: boolean
  hideShare?: boolean
  onShared?: () => void
  onCleared?: () => void
  onBack?: () => void
  tooltip?: string
  tutorialType?: TutorialType
}) {
  const navigate = useNavigate()
  const below768 = useMedia('(max-width: 768px)')
  const goBack = () => {
    navigate(-1)
  }

  const theme = useTheme()
  const arrow = (
    <ButtonBack width="fit-content" padding="0" onClick={!!onBack ? onBack : goBack}>
      {alignTitle === 'left' ? <ChevronLeft color={theme.subText} /> : <StyledArrowLeft />}
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
              ? ''
              : action === LiquidityAction.REMOVE
              ? t`Removing pool tokens converts your position back into underlying tokens at the current rate, proportional to your share of the pool. Accrued fees are included in the amounts you receive`
              : '')
          }
        />
      )}
    </Flex>
  )
  return (
    <Tabs>
      <Wrapper>
        {below768 || alignTitle === 'left' ? (
          <Flex alignItems={'center'}>
            {arrow}
            {title}
          </Flex>
        ) : (
          <>
            {arrow}
            {title}
          </>
        )}
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
          {!hideShare && <ShareButtonWithModal onShared={onShared} title={t`Share with your friends!`} />}
        </Flex>
      </Wrapper>
    </Tabs>
  )
}
