import React from 'react'
import { Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import { AutoColumn } from 'components/Column'
import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { OutlineCard } from 'components/Card'
import Divider from 'components/Divider'
import { RowBetween, RowFixed } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { Trans } from '@lingui/macro'
import { formatDollarAmount } from 'utils/numbers'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { ZERO } from '@kyberswap/ks-sdk-classic'

export default function ProAmmPooledTokens({
  liquidityValue0,
  liquidityValue1,
  layout = 0,
  valueUSD,
  stakedUsd,
  title,
  pooled = false,
}: {
  liquidityValue0: CurrencyAmount<Currency> | undefined
  liquidityValue1: CurrencyAmount<Currency> | undefined
  layout?: number
  valueUSD?: number
  stakedUsd?: number
  title?: string
  pooled?: boolean
}) {
  const theme = useTheme()
  const render =
    layout === 0 ? (
      <OutlineCard marginTop="1rem" padding="1rem">
        <AutoColumn gap="md">
          <Text fontSize="16px" fontWeight="500">
            <Trans>{title || 'Your Liquidity'}</Trans>
          </Text>

          <Divider />
          {liquidityValue0?.greaterThan(ZERO) && (
            <RowBetween>
              <Text fontSize={12} fontWeight={500} color={theme.subText}>
                {pooled && 'POOLED'} {liquidityValue0?.currency && unwrappedToken(liquidityValue0.currency)?.symbol}
              </Text>
              <RowFixed>
                <CurrencyLogo
                  size="16px"
                  style={{ marginLeft: '8px' }}
                  currency={unwrappedToken(liquidityValue0.currency)}
                />
                <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                  {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}{' '}
                  {liquidityValue0?.currency && unwrappedToken(liquidityValue0.currency)?.symbol}
                </Text>
              </RowFixed>
            </RowBetween>
          )}
          {liquidityValue1?.greaterThan(ZERO) && (
            <RowBetween>
              <Text fontSize={12} fontWeight={500} color={theme.subText}>
                {pooled && 'POOLED'} {liquidityValue1?.currency && unwrappedToken(liquidityValue1.currency)?.symbol}
              </Text>
              <RowFixed>
                <CurrencyLogo
                  size="16px"
                  style={{ marginLeft: '8px' }}
                  currency={unwrappedToken(liquidityValue1.currency)}
                />
                <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                  {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}{' '}
                  {liquidityValue1?.currency && unwrappedToken(liquidityValue1.currency)?.symbol}
                </Text>
              </RowFixed>
            </RowBetween>
          )}
        </AutoColumn>
      </OutlineCard>
    ) : (
      <>
        <OutlineCard marginTop="1rem" padding="1rem">
          <AutoColumn gap="md">
            <RowBetween>
              <Text fontSize={12} fontWeight="500" color={theme.subText}>
                <Trans>Your Liquidity Balance</Trans>
              </Text>
              <Text fontSize={12} fontWeight="500">
                {formatDollarAmount(valueUSD || 0)}
              </Text>
            </RowBetween>
            <RowBetween>
              <Text fontSize={12} fontWeight={500} color={theme.subText}>
                <Trans>Your Pooled {liquidityValue0?.currency?.symbol}</Trans>
              </Text>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
                <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                  {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}{' '}
                  {liquidityValue0?.currency.symbol}
                </Text>
              </RowFixed>
            </RowBetween>
            <RowBetween>
              <Text fontSize={12} fontWeight={500} color={theme.subText}>
                <Trans>Your Pooled {liquidityValue1?.currency?.symbol}</Trans>
              </Text>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
                <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                  {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}{' '}
                  {liquidityValue1?.currency.symbol}
                </Text>
              </RowFixed>
            </RowBetween>

            <RowBetween>
              <Text fontSize={12} fontWeight="500" color={theme.subText}>
                <Trans>Your Staked Balance</Trans>
              </Text>
              <Text fontSize={12} fontWeight="500">
                {formatDollarAmount(stakedUsd || 0)}
              </Text>
            </RowBetween>
          </AutoColumn>
        </OutlineCard>
      </>
    )
  return render
}
