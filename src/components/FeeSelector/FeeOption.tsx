import { Trans } from '@lingui/macro'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ButtonRadioChecked } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution'
import { PoolState } from 'hooks/usePools'
import React from 'react'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'

import { FeeTierPercentageBadge } from './FeeTierPercentageBadge'
import { FEE_AMOUNT_DETAIL } from './shared'

const ResponsiveText = styled(TYPE.label)`
  line-height: 16px;
  font-size: 14px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
    line-height: 12px;
  `};
`

interface FeeOptionProps {
  feeAmount: FeeAmount
  active: boolean
  distributions: ReturnType<typeof useFeeTierDistribution>['distributions']
  poolState: PoolState
  onClick: () => void
}

export function FeeOption({ feeAmount, active, poolState, distributions, onClick }: FeeOptionProps) {
  return (
    <ButtonRadioChecked active={active} onClick={onClick}>
      <AutoColumn gap="sm" justify="flex-start">
        <AutoColumn justify="flex-start" gap="6px">
          <ResponsiveText>
            <Trans>{FEE_AMOUNT_DETAIL[feeAmount].label}%</Trans>
          </ResponsiveText>
          <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
            {FEE_AMOUNT_DETAIL[feeAmount].description}
          </TYPE.main>
        </AutoColumn>

        {distributions && (
          <FeeTierPercentageBadge distributions={distributions} feeAmount={feeAmount} poolState={poolState} />
        )}
      </AutoColumn>
    </ButtonRadioChecked>
  )
}
