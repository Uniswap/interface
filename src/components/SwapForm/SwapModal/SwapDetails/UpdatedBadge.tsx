import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import React from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import InfoHelper from 'components/InfoHelper'
import { RESERVE_USD_DECIMALS } from 'constants/index'
import useTheme from 'hooks/useTheme'

const BadgeWrapper = styled(AutoColumn).attrs<Pick<Props, '$level'>>(props => ({
  'data-level': props['$level'],
}))<Pick<Props, '$level'>>`
  display: flex;
  align-items: center;
  gap: 4px;

  padding: 4px 8px;
  border-radius: 36px;

  line-height: 1;
  font-size: 12px;
  font-weight: 400;

  &[data-level='worst'] {
    background-color: ${({ theme }) => transparentize(0.9, theme.red)};
    color: ${({ theme }) => theme.red};
  }

  &[data-level='worse'] {
    background-color: ${({ theme }) => transparentize(0.9, theme.warning)};
    color: ${({ theme }) => theme.warning};
  }

  &[data-level='better'] {
    background-color: ${({ theme }) => transparentize(0.9, theme.primary)};
    color: ${({ theme }) => theme.primary};
  }
`

export type Level = 'better' | 'worse' | 'worst' | undefined

export interface Props {
  $level: Level
  outputAmount: CurrencyAmount<Currency>
}

export default function UpdatedBadge({ $level, outputAmount }: Props) {
  const theme = useTheme()

  if (!$level) {
    return null
  }

  return (
    <BadgeWrapper $level={$level}>
      {$level === 'better' && (
        <InfoHelper
          placement="top"
          size={14}
          color={theme.primary}
          text={
            <Text fontSize={12}>
              <Trans>
                We got you a higher amount. The initial output amount was{' '}
                {outputAmount.toSignificant(RESERVE_USD_DECIMALS)} {outputAmount.currency.symbol}
              </Trans>
            </Text>
          }
        ></InfoHelper>
      )}
      <Trans>Updated</Trans>
    </BadgeWrapper>
  )
}
