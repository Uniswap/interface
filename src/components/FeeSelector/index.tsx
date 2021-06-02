import React from 'react'
import { FeeAmount } from '@uniswap/v3-sdk'
import { Trans } from '@lingui/macro'
import { AutoColumn } from 'components/Column'
import { DynamicSection } from 'pages/AddLiquidity/styled'
import { TYPE } from 'theme'
import { RowBetween } from 'components/Row'
import { ButtonRadioChecked } from 'components/Button'
import styled from 'styled-components/macro'

const ResponsiveText = styled(TYPE.label)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `};
`

export default function FeeSelector({
  disabled = false,
  feeAmount,
  handleFeePoolSelect,
}: {
  disabled?: boolean
  feeAmount?: FeeAmount
  handleFeePoolSelect: (feeAmount: FeeAmount) => void
}) {
  return (
    <AutoColumn gap="16px">
      <DynamicSection gap="md" disabled={disabled}>
        <TYPE.label>
          <Trans>Select Pool</Trans>
        </TYPE.label>
        <TYPE.main fontSize={14} fontWeight={400} style={{ marginBottom: '.5rem', lineHeight: '125%' }}>
          <Trans>Select a pool type based on your preferred liquidity provider fee.</Trans>
        </TYPE.main>
        <RowBetween>
          <ButtonRadioChecked
            width="32%"
            active={feeAmount === FeeAmount.LOW}
            onClick={() => handleFeePoolSelect(FeeAmount.LOW)}
          >
            <AutoColumn gap="sm" justify="flex-start">
              <ResponsiveText>
                <Trans>0.05% fee</Trans>
              </ResponsiveText>
              <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                <Trans>Best for stable pairs.</Trans>
              </TYPE.main>
            </AutoColumn>
          </ButtonRadioChecked>
          <ButtonRadioChecked
            width="32%"
            active={feeAmount === FeeAmount.MEDIUM}
            onClick={() => handleFeePoolSelect(FeeAmount.MEDIUM)}
          >
            <AutoColumn gap="sm" justify="flex-start">
              <ResponsiveText>
                <Trans>0.3% fee</Trans>
              </ResponsiveText>
              <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                <Trans>Best for most pairs.</Trans>
              </TYPE.main>
            </AutoColumn>
          </ButtonRadioChecked>
          <ButtonRadioChecked
            width="32%"
            active={feeAmount === FeeAmount.HIGH}
            onClick={() => handleFeePoolSelect(FeeAmount.HIGH)}
          >
            <AutoColumn gap="sm" justify="flex-start">
              <ResponsiveText>
                <Trans>1% fee</Trans>
              </ResponsiveText>
              <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                <Trans>Best for exotic pairs.</Trans>
              </TYPE.main>
            </AutoColumn>
          </ButtonRadioChecked>
        </RowBetween>
      </DynamicSection>
    </AutoColumn>
  )
}
