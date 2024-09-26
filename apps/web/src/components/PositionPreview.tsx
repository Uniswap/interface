import { Currency } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import RangeBadge from 'components/Badge/RangeBadge'
import { LightCard } from 'components/Card/cards'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import RateToggle from 'components/RateToggle'
import { AutoColumn } from 'components/deprecated/Column'
import { RowBetween, RowFixed } from 'components/deprecated/Row'
import { Break } from 'components/earn/styled'
import { BIPS_BASE } from 'constants/misc'
import JSBI from 'jsbi'
import { BlastRebasingAlert } from 'pages/AddLiquidity/blastAlerts'
import { ReactNode, useCallback, useState } from 'react'
import { Bound } from 'state/mint/v3/actions'
import { ThemedText } from 'theme/components'
import { Text } from 'ui/src'
import { Trans } from 'uniswap/src/i18n'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { unwrappedToken } from 'utils/unwrappedToken'

export const PositionPreview = ({
  position,
  title,
  inRange,
  baseCurrencyDefault,
  ticksAtLimit,
  showBlastAlert,
}: {
  position: Position
  title?: ReactNode
  inRange: boolean
  baseCurrencyDefault?: Currency
  ticksAtLimit: { [bound: string]: boolean | undefined }
  showBlastAlert?: boolean
}) => {
  const { formatCurrencyAmount, formatDelta, formatPrice, formatTickPrice } = useFormatter()

  const currency0 = unwrappedToken(position.pool.token0)
  const currency1 = unwrappedToken(position.pool.token1)

  // track which currency should be base
  const [baseCurrency, setBaseCurrency] = useState(
    baseCurrencyDefault
      ? baseCurrencyDefault === currency0
        ? currency0
        : baseCurrencyDefault === currency1
          ? currency1
          : currency0
      : currency0,
  )

  const sorted = baseCurrency === currency0
  const quoteCurrency = sorted ? currency1 : currency0

  const price = sorted ? position.pool.priceOf(position.pool.token0) : position.pool.priceOf(position.pool.token1)

  const priceLower = sorted ? position.token0PriceLower : position.token0PriceUpper.invert()
  const priceUpper = sorted ? position.token0PriceUpper : position.token0PriceLower.invert()

  const handleRateChange = useCallback(() => {
    setBaseCurrency(quoteCurrency)
  }, [quoteCurrency])

  const removed = position?.liquidity && JSBI.equal(position?.liquidity, JSBI.BigInt(0))

  return (
    <AutoColumn gap="md" style={{ marginTop: '0.5rem' }}>
      <RowBetween style={{ marginBottom: '0.5rem' }}>
        <RowFixed>
          <DoubleCurrencyLogo currencies={[currency0, currency1]} size={24} />
          <ThemedText.DeprecatedLabel ml="10px" fontSize="24px">
            {currency0?.symbol} / {currency1?.symbol}
          </ThemedText.DeprecatedLabel>
        </RowFixed>
        <RangeBadge removed={removed} inRange={inRange} />
      </RowBetween>
      {showBlastAlert && <BlastRebasingAlert />}
      <LightCard>
        <AutoColumn gap="md">
          <RowBetween>
            <RowFixed>
              <CurrencyLogo currency={currency0} />
              <ThemedText.DeprecatedLabel ml="8px">{currency0?.symbol}</ThemedText.DeprecatedLabel>
            </RowFixed>
            <RowFixed>
              <ThemedText.DeprecatedLabel mr="8px">
                {formatCurrencyAmount({ amount: position.amount0 })}
              </ThemedText.DeprecatedLabel>
            </RowFixed>
          </RowBetween>
          <RowBetween>
            <RowFixed>
              <CurrencyLogo currency={currency1} />
              <ThemedText.DeprecatedLabel ml="8px">{currency1?.symbol}</ThemedText.DeprecatedLabel>
            </RowFixed>
            <RowFixed>
              <ThemedText.DeprecatedLabel mr="8px">
                {formatCurrencyAmount({ amount: position.amount1 })}
              </ThemedText.DeprecatedLabel>
            </RowFixed>
          </RowBetween>
          <Break />
          <RowBetween>
            <ThemedText.DeprecatedLabel>
              <Trans i18nKey="fee.tier" />
            </ThemedText.DeprecatedLabel>
            <ThemedText.DeprecatedLabel>{formatDelta(position?.pool?.fee / BIPS_BASE)}</ThemedText.DeprecatedLabel>
          </RowBetween>
        </AutoColumn>
      </LightCard>
      <AutoColumn gap="md">
        <RowBetween>
          {title ? <ThemedText.DeprecatedMain>{title}</ThemedText.DeprecatedMain> : <div />}
          <RateToggle
            currencyA={sorted ? currency0 : currency1}
            currencyB={sorted ? currency1 : currency0}
            handleRateToggle={handleRateChange}
          />
        </RowBetween>

        <RowBetween>
          <LightCard width="48%" padding="8px">
            <AutoColumn gap="4px" justify="center">
              <ThemedText.DeprecatedMain fontSize="12px">
                <Trans i18nKey="pool.minPrice" />
              </ThemedText.DeprecatedMain>
              <ThemedText.DeprecatedMediumHeader textAlign="center">
                {formatTickPrice({
                  price: priceLower,
                  atLimit: ticksAtLimit,
                  direction: Bound.LOWER,
                })}
              </ThemedText.DeprecatedMediumHeader>
              <ThemedText.DeprecatedMain textAlign="center" fontSize="12px">
                <Trans
                  i18nKey="common.feesEarnedPerBase"
                  values={{ symbolA: quoteCurrency.symbol, symbolB: baseCurrency.symbol }}
                />
              </ThemedText.DeprecatedMain>
              <Text fontSize={11} textAlign="center" color="$neutral3" mt={4}>
                <Trans i18nKey="pool.position.willBe100" values={{ sym: baseCurrency?.symbol }} />
              </Text>
            </AutoColumn>
          </LightCard>

          <LightCard width="48%" padding="8px">
            <AutoColumn gap="4px" justify="center">
              <ThemedText.DeprecatedMain fontSize="12px">
                <Trans i18nKey="pool.maxPrice" />
              </ThemedText.DeprecatedMain>
              <ThemedText.DeprecatedMediumHeader textAlign="center">
                {formatTickPrice({
                  price: priceUpper,
                  atLimit: ticksAtLimit,
                  direction: Bound.UPPER,
                })}
              </ThemedText.DeprecatedMediumHeader>
              <ThemedText.DeprecatedMain textAlign="center" fontSize="12px">
                <Trans
                  i18nKey="common.feesEarnedPerBase"
                  values={{ symbolA: quoteCurrency.symbol, symbolB: baseCurrency.symbol }}
                />
              </ThemedText.DeprecatedMain>
              <Text fontSize={11} textAlign="center" color="$neutral3" mt={4}>
                <Trans i18nKey="pool.position.willBe100" values={{ sym: quoteCurrency?.symbol }} />
              </Text>
            </AutoColumn>
          </LightCard>
        </RowBetween>
        <LightCard padding="12px ">
          <AutoColumn gap="4px" justify="center">
            <ThemedText.DeprecatedMain fontSize="12px">
              <Trans i18nKey="common.currentPrice" />
            </ThemedText.DeprecatedMain>
            <ThemedText.DeprecatedMediumHeader>{`${formatPrice({
              price,
              type: NumberType.TokenTx,
            })} `}</ThemedText.DeprecatedMediumHeader>
            <ThemedText.DeprecatedMain textAlign="center" fontSize="12px">
              <Trans
                i18nKey="common.feesEarnedPerBase"
                values={{ symbolA: quoteCurrency.symbol, symbolB: baseCurrency.symbol }}
              />
            </ThemedText.DeprecatedMain>
          </AutoColumn>
        </LightCard>
      </AutoColumn>
    </AutoColumn>
  )
}
