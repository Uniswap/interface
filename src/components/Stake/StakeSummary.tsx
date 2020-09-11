import { BigNumber as EthBigNumber } from '@ethersproject/bignumber'
import { formatUnits } from '@ethersproject/units'
import BigNumber from 'bignumber.js'
import React, { FC, useCallback, useContext, useEffect, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import Question from '../../components/Stake/QuestionTooltip'
import CRO_TOKEN from '../../constants/croToken'
import { Field } from '../../constants/stakeContractAddress'
import { useActiveWeb3React } from '../../hooks'
import { PersonalStakes, useCryptoStakeSummary } from '../../state/stake/hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { ExternalLink } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import StakeSummaryTermItem from './StakeSummaryTermItem'
import { UnstakeModal } from './UnstakeModal'
import { useActiveWeb3React } from '../../hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import CRO_TOKEN from '../../constants/croToken'
import formatNumber from '../../utils/formatNumber'

const InfoCard = styled.div`
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
  border: solid 1px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0.75rem 1rem;
`

const StyledTitle = styled.div<{ size?: number }>`
  font-size: ${({ size }) => (size ? size + 'px' : '24px')};
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: ${({ theme }) => theme.text3};
`

const StyledSummarySubtitle = styled.div`
  opacity: 0.5;
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.71;
  letter-spacing: normal;
  color: ${({ theme }) => theme.text3};
`

const StyledCROPrice = styled.div`
  font-size: 14px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.71;
  letter-spacing: normal;
  text-align: right;
  color: ${({ theme }) => theme.text3};
`

interface StakeSummaryState {
  hasStake: boolean
  totalStaked: string
  totalAccruedCro: string
  stakeElements: PersonalStakes[]
  isOpen: boolean
  stakeAmount: EthBigNumber | undefined
  terms: Field | undefined
  balance: string | undefined
}

interface Action extends Partial<StakeSummaryState> {
  type: 'init' | 'update' | 'unstaking' | 'unstaking_dismiss' | 'balance_update'
}

const initialState: StakeSummaryState = {
  hasStake: false,
  totalStaked: '0',
  totalAccruedCro: '0',
  stakeElements: [],
  isOpen: false,
  stakeAmount: undefined,
  terms: undefined,
  balance: undefined
}

function reducer(state: StakeSummaryState, action: Action): StakeSummaryState {
  switch (action.type) {
    case 'init':
      return initialState

    case 'balance_update':
      return {
        ...state,
        balance: action.balance
      }

    case 'update':
      return {
        ...state,
        ...action
      }

    case 'unstaking':
      return {
        ...state,
        isOpen: true,
        stakeAmount: action.stakeAmount,
        terms: action.terms
      }

    case 'unstaking_dismiss':
      return {
        ...state,
        isOpen: false,
        stakeAmount: undefined,
        terms: undefined
      }

    default:
      throw new Error(`Unknown type ${action.type}`)
  }
}

const CalculateYieldLink = styled(Link)`
  text-decoration: none;
  cursor: pointer;
  color: ${({ theme }) => theme.primary1};
`

const StakeSummary: FC = () => {
  const theme = useContext(ThemeContext)
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(reducer, initialState)

  const { account, chainId } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, CRO_TOKEN ?? undefined)
  const { getStakeSummaryFromContract, getOutstandingStakes, getTotalAccruedCro } = useCryptoStakeSummary()

  const updateStakeSummary = useCallback(async () => {
    const stakeSummary = await getStakeSummaryFromContract()

    let totalStakedCal = EthBigNumber.from(0)
    for (const [, value] of Object.entries(stakeSummary)) {
      totalStakedCal = totalStakedCal.add(EthBigNumber.from(value))
    }

    dispatch({
      type: 'update',
      hasStake: !totalStakedCal.eq(EthBigNumber.from(0)),
      totalStaked: formatUnits(totalStakedCal, 8)
    })
  }, [dispatch, getStakeSummaryFromContract])

  const updateOutstandingStakes = useCallback(async () => {
    const outstandingStake = await getOutstandingStakes()

    let elementList: PersonalStakes[] = []

    for (const [, arr] of Object.entries(outstandingStake)) elementList = elementList.concat(arr)

    dispatch({
      type: 'update',
      stakeElements: elementList
    })
  }, [getOutstandingStakes, dispatch])

  useEffect(() => {
    if (dispatch) dispatch({ type: 'init' })
  }, [dispatch])

  // Balance listeners
  useEffect(() => {
    if (!selectedCurrencyBalance || !dispatch || !state) return

    if (selectedCurrencyBalance.toExact() === state.balance) return

    dispatch({
      type: 'balance_update',
      balance: selectedCurrencyBalance.toExact()
    })
  }, [selectedCurrencyBalance, dispatch, state])

  // If CRO balance update => refresh the stake summary
  useEffect(() => {
    if (!updateOutstandingStakes || !updateStakeSummary) return
    updateOutstandingStakes()
    updateStakeSummary()
  }, [state.balance, updateOutstandingStakes, updateStakeSummary])

  useEffect(() => {
    if (!getTotalAccruedCro || !dispatch) return

    async function handleTotalAccruedCro() {
      const { totalAccruedCro } = await getTotalAccruedCro()

      dispatch({
        type: 'update',
        totalAccruedCro: totalAccruedCro
      })
    }
    handleTotalAccruedCro()
  }, [dispatch, getTotalAccruedCro])

  function onUnstake(amount: EthBigNumber, terms: Field) {
    dispatch({
      type: 'unstaking',
      stakeAmount: amount,
      terms
    })
  }

  function onStakeModalDismiss() {
    dispatch({
      type: 'unstaking_dismiss'
    })
  }

  return (
    <>
      <AutoColumn gap="lg">
        {state.hasStake ? (
          <>
            <UnstakeModal
              isOpen={state.isOpen}
              stakeAmount={state.stakeAmount}
              terms={state.terms}
              onDismiss={onStakeModalDismiss}
            />
            <InfoCard theme={theme}>
              <RowBetween>
                <StyledTitle size={14}>
                  <span role="img" aria-label="Ear of Rice" style={{ fontFamily: 'AppleColorEmoji' }}>
                    🌾
                  </span>{' '}
                  {t('stake_summary_title')}
                </StyledTitle>
              </RowBetween>
              <br />
              <RowBetween>
                <StyledSummarySubtitle>{t('stake_summary_total_staked_cro')}</StyledSummarySubtitle>
                <StyledCROPrice>{`${formatNumber(state.totalStaked)} CRO`}</StyledCROPrice>
              </RowBetween>
              <RowBetween>
                <StyledSummarySubtitle>
                  {t('stake_summary_accrued_cro_rewards')}
                  <Question
                    text={
                      <>
                        {t('boost_tooltip_1')}
                        <ExternalLink
                          href={`http://help.crypto.com/en/articles/4429871-how-is-my-accrued-cro-defi-yield-calculated-on-defi-swap`}
                        >
                          {t('boost_tooltip_click_here')}
                        </ExternalLink>
                        {t('boost_tooltip_2')}
                      </>
                    }
                  />
                </StyledSummarySubtitle>
                <StyledCROPrice>{`${formatNumber(state.totalAccruedCro)} CRO`}</StyledCROPrice>
              </RowBetween>
            </InfoCard>
            <RowBetween>
              <StyledTitle size={14}>{t('stake_summary_title_skate_terms')}</StyledTitle>
            </RowBetween>
            <AutoColumn gap="sm">
              {state.stakeElements.map((item, index) => (
                <StakeSummaryTermItem key={index} {...item} onUnstake={onUnstake} chainId={chainId} />
              ))}
            </AutoColumn>
          </>
        ) : (
          <AutoColumn gap="lg" justify="center">
            <CalculateYieldLink to="/swap-apy">
              <Text fontWeight={500} fontSize={20}>
                📈{t('boost_btn_yield')}
              </Text>
            </CalculateYieldLink>
          </AutoColumn>
        )}
      </AutoColumn>
    </>
  )
}

export default StakeSummary
