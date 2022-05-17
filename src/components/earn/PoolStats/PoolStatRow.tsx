import { LightQuestionHelper } from 'components/QuestionHelper'
import { RowBetween, RowFixed } from 'components/Row'
import React from 'react'
import styled from 'styled-components'
import { TYPE } from 'theme'

const PoolRateWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  flex-direction: column;
`
export interface PoolRewardProps {
  helperText?: React.ReactNode
  statName: string
  statValue?: string
  statArrayValue?: string[]
}

export default function PoolStatRow({ helperText, statName, statValue, statArrayValue }: PoolRewardProps) {
  return (
    <RowBetween>
      <RowFixed>
        <TYPE.white>{statName}</TYPE.white>
        {helperText && <LightQuestionHelper text={helperText} />}
      </RowFixed>
      {statValue ? (
        <TYPE.white>{statValue ? statValue : '-'}</TYPE.white>
      ) : statArrayValue ? (
        <PoolRateWrapper>
          {statArrayValue.map((value, i) => (
            <TYPE.white key={i}>{value ? value : '-'}</TYPE.white>
          ))}
        </PoolRateWrapper>
      ) : null}
    </RowBetween>
  )
}
