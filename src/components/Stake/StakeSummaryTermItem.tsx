import { BigNumber } from '@ethersproject/bignumber'
import { formatUnits } from '@ethersproject/units'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import styled from 'styled-components'
import { ChainId } from 'swap-sdk'
import CRO_ICON from '../../assets/images/cro-icon.png'
import { Field } from '../../constants/stakeContractAddress'
import { PersonalStakes } from '../../state/stake/hooks'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import formatNumber from '../../utils/formatNumber'

dayjs.extend(duration)

const InfoCard = styled.div`
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
  border: solid 1px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0.75rem 1rem;
`

const StyledIcon = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
  margin-right: 8px;
`

const ClickableText = styled.span`
  font-size: 12px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: ${({ theme }) => theme.primary1};
  cursor: pointer;
`

const StyledText = styled.span`
  font-size: 14px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.71;
  letter-spacing: normal;
  color: ${({ theme }) => theme.text3};
`
const StyledItemTitleColumn = styled(RowBetween)`
  display: flex;
  justify-content: start;
  align-items: center;
  margin-bottom: 4px;
`

interface StakeSummaryTermItemProps extends PersonalStakes {
  onUnstake: (amount: BigNumber, terms: Field) => void
  chainId: ChainId | undefined
}

/**
 *
 * @param chainId ChainId
 * @param millisecond remaining duration in milliseconds
 * @param t i18n function
 */
function calRemainingDuration(chainId: ChainId | undefined, millisecond: number, t: Function): string {
  if (chainId === ChainId.MAINNET) return `${Math.ceil(dayjs.duration(millisecond).asDays())} ${t('days')}`

  return `${Math.ceil(dayjs.duration(millisecond).asMinutes())} ${t('minutes')}`
}

// eslint-disable-next-line react/prop-types
const StakeSummaryTermItem = ({ isDue, terms, dayDiff, amount, onUnstake, chainId }: StakeSummaryTermItemProps) => {
  const { t } = useTranslation()

  function OnUnstakeClicked(event: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
    event.preventDefault()
    onUnstake(amount, terms)
  }

  return (
    <InfoCard>
      <AutoColumn gap="sm">
        <RowBetween>
          <div>
            <StyledItemTitleColumn>
              <StyledIcon src={CRO_ICON} alt="" />
              <StyledText>{t(terms)}</StyledText>
            </StyledItemTitleColumn>
            <RowBetween>
              <Text fontWeight={500} fontSize={12}>
                {isDue ? (
                  <>
                    {t('staking_term_end')}{' '}
                    <ClickableText onClick={OnUnstakeClicked}>{t('unstake_link')}</ClickableText>
                  </>
                ) : (
                  <>
                    {t('stakes_end_in')} {calRemainingDuration(chainId, dayDiff, t)}
                  </>
                )}
              </Text>
            </RowBetween>
          </div>

          <div>
            <StyledText>{formatNumber(formatUnits(amount, 8))} CRO</StyledText>
          </div>
        </RowBetween>
      </AutoColumn>
    </InfoCard>
  )
}

export default StakeSummaryTermItem
